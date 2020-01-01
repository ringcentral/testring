import * as path from 'path';
import { loggerClient } from '@testring/logger';
import { FSReader } from '@testring/fs-reader';
import { fork } from '@testring/child-process';
import { generateUniqId } from '@testring/utils';
import { TestWorkerLocal } from './test-worker-local';
import {
    buildDependencyDictionary,
    mergeDependencyDictionaries,
} from '@testring/dependencies-builder';
import {
    IFile,
    ITransport,
    ITestWorkerConfig,
    ITestWorkerInstance,
    ITestExecutionCompleteMessage,
    ITestExecutionMessage,
    TestWorkerAction,
    FileCompiler,
    TestStatus,
    IWorkerEmitter,
} from '@testring/types';

const WORKER_ROOT = require.resolve(
    path.resolve(__dirname, 'worker')
);

const WORKER_DEFAULT_CONFIG: ITestWorkerConfig = {
    screenshots: 'disable',
    waitForRelease: false,
    localWorker: false,
};

const delay = (timeout: number) => new Promise<void>(resolve => setTimeout(resolve, timeout));

export class TestWorkerInstance implements ITestWorkerInstance {

    private config: ITestWorkerConfig;

    private fsReader = new FSReader();

    private compileCache: Map<string, string> = new Map();

    private successTestExecution: Function | null = null;

    private abortTestExecution: Function | null = null;

    private worker: IWorkerEmitter | null = null;

    private queuedWorker: Promise<IWorkerEmitter> | null = null;

    private workerID = `worker/${generateUniqId()}`;

    private logger = loggerClient;

    private workerExitHandler = (exitCode) => {
        this.clearWorkerHandlers();
        this.worker = null;

        if (this.abortTestExecution !== null) {
            this.abortTestExecution(
                new Error(`[${this.getWorkerID()}] unexpected worker shutdown. Exit Code: ${exitCode}`)
            );

            this.successTestExecution = null;
            this.abortTestExecution = null;
        }
    };


    private workerErrorHandler = (error) => {
        if (this.abortTestExecution !== null) {
            this.abortTestExecution(error);

            this.successTestExecution = null;
            this.abortTestExecution = null;
        }
    };

    constructor(
        private transport: ITransport,
        private compile: FileCompiler,
        private beforeCompile: (paths: Array<string>, filePath: string, fileContent: string) => Promise<Array<string>>,
        workerConfig: Partial<ITestWorkerConfig> = {}
    ) {
        this.config = this.createConfig(workerConfig);
    }

    private createConfig(workerConfig: Partial<ITestWorkerConfig>): ITestWorkerConfig {
        return {
            ...WORKER_DEFAULT_CONFIG,
            ...workerConfig,
        };
    }

    public async execute(file: IFile, parameters: any, envParameters: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                return await this.makeExecutionRequest(
                    file,
                    parameters,
                    envParameters,
                    resolve,
                    reject
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    public getWorkerID() {
        return this.workerID;
    }

    public async kill(signal: NodeJS.Signals = 'SIGTERM') {
        if (this.queuedWorker !== null) {
            await this.queuedWorker;

            // Dirty hack for correct handling queued worker resolving.
            // Adds gap between microtasks chain,
            // that helps to execute sync code in "makeExecutionRequest" before this
            await delay(100);
            await this.kill(signal);

            this.logger.debug(`Waiting for queue ${this.getWorkerID()}`);
        } else if (this.worker !== null) {
            this.clearWorkerHandlers();

            let waitForKill = new Promise((resolve) => {
                if (this.worker !== null) {
                    this.worker.once('exit', () => {
                        resolve();
                    });
                } else {
                    resolve();
                }
            });

            this.worker.kill(signal);
            await waitForKill;

            this.worker = null;

            if (this.successTestExecution !== null) {
                this.successTestExecution();

                this.successTestExecution = null;
                this.abortTestExecution = null;
            }

            this.logger.debug(`Killed child process ${this.getWorkerID()}`);
        }
    }

    private async getExecutionPayload(
        file: IFile,
        parameters: any,
        envParameters: any,
    ) {
        const additionalFiles = await this.beforeCompile([], file.path, file.content);

        // Calling external hooks to compile source
        const compiledSource = await this.compileSource(file.content, file.path);
        // TODO implement code instrumentation here

        const compiledFile = {
            path: file.path,
            content: compiledSource,
        };

        let dependencies = await buildDependencyDictionary(compiledFile, this.readDependency.bind(this));

        for (let i = 0, len = additionalFiles.length; i < len; i++) {
            const file = await this.fsReader.readFile(additionalFiles[i]);

            if (file) {
                const additionalDependencies = await buildDependencyDictionary(file, this.readDependency.bind(this));

                dependencies = await mergeDependencyDictionaries(dependencies, additionalDependencies);
            }
        }

        return {
            waitForRelease: this.config.waitForRelease,
            ...compiledFile,
            dependencies,
            parameters,
            envParameters,
        };
    }

    private async makeExecutionRequest(
        file: IFile,
        parameters: any,
        envParameters: any,
        resolve,
        reject
    ) {
        const worker = await this.initWorker();

        const relativePath = path.relative(process.cwd(), file.path);
        const payload = await this.getExecutionPayload(file, parameters, envParameters);

        this.logger.debug(`Sending test for execution: ${relativePath}`);

        const completeHandler = (message) => {
            switch (message.status) {
                case TestStatus.done:
                    resolve();
                    break;

                case TestStatus.failed:
                    reject(message.error);
                    break;
            }

            this.successTestExecution = null;
            this.abortTestExecution = null;
        };

        let removeListener;
        if (this.config.localWorker) {
            removeListener = this.transport.once<ITestExecutionCompleteMessage>(
                TestWorkerAction.executionComplete,
                completeHandler
            );
        } else {
            removeListener = this.transport.onceFrom<ITestExecutionCompleteMessage>(
                this.getWorkerID(),
                TestWorkerAction.executionComplete,
                completeHandler
            );
        }

        this.successTestExecution = () => {
            removeListener();
            resolve();
        };

        this.abortTestExecution = (error) => {
            removeListener();
            reject(error);
        };

        if (this.config.localWorker) {
            await worker.send({ type: TestWorkerAction.executeTest, payload });
        } else {
            await this.transport.send<ITestExecutionMessage>(this.getWorkerID(), TestWorkerAction.executeTest, payload);
        }
    }

    private async compileSource(source: string, filename: string): Promise<string> {
        const cachedSource = this.compileCache.get(source);

        if (cachedSource) {
            return cachedSource;
        }

        try {
            this.logger.debug(`Compile source file ${filename}`);

            const compiledSource = await this.compile(source, filename);

            this.compileCache.set(source, compiledSource);

            return compiledSource;
        } catch (error) {
            this.logger.error(`Compilation ${filename} failed`);

            throw error;
        }
    }

    private async initWorker(): Promise<IWorkerEmitter> {
        if (this.queuedWorker) {
            return this.queuedWorker;
        } else if (this.config.localWorker) {
            this.queuedWorker = this.createLocalWorker()
                .then((worker) => {
                    this.worker = worker;
                    this.queuedWorker = null;

                    return worker;
                });

            return this.queuedWorker;
        } else if (this.worker === null) {
            this.queuedWorker = this.createWorker()
                .then((worker) => {
                    this.worker = worker;
                    this.queuedWorker = null;

                    return worker;
                });

            return this.queuedWorker;
        }

        return this.worker;
    }

    private async createLocalWorker(): Promise<IWorkerEmitter> {
        const worker = new TestWorkerLocal(this.transport);

        this.logger.debug('Created local worker');

        return worker;
    }

    private async createWorker(): Promise<IWorkerEmitter> {
        const worker = await fork(WORKER_ROOT, [], {});

        if (worker.stdout) {
            worker.stdout.on('data', (data) => {
                this.logger.log(`[${this.getWorkerID()}] [logged] ${data.toString().trim()}`);
            });
        } else {
            console.warn(`[TestWorkerInstance] The STDOUT of worker ${this.getWorkerID()} is null`);
        }

        if (worker.stderr) {
            worker.stderr.on('data', (data) => {
                this.logger.error(`[${this.getWorkerID()}] [error] ${data.toString().trim()}`);
            });
        } else {
            console.warn(`[TestWorkerInstance] The STDERR of worker ${this.getWorkerID()} is null`);
        }

        worker.on('error', this.workerErrorHandler);
        worker.once('exit', this.workerExitHandler);

        this.transport.registerChild(this.getWorkerID(), worker);

        this.logger.debug(`Registered child process ${this.getWorkerID()}`);

        return worker;
    }

    private async readDependency(dependencyPath: string): Promise<string> {
        const rawFile = await this.fsReader.readFile(dependencyPath);
        const rawContent = rawFile ? rawFile.content : '';

        return this.compile(rawContent, dependencyPath);
    }

    private clearWorkerHandlers() {
        if (this.worker === null) {
            return;
        }

        this.worker.removeListener('error', this.workerErrorHandler);
        this.worker.removeListener('exit', this.workerExitHandler);
    }
}
