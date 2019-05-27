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
    DependencyFileReaderResult,
} from '@testring/types';

import * as path from 'path';

import { loggerClient } from '@testring/logger';
import { FSReader } from '@testring/fs-reader';
import { fork } from '@testring/child-process';
import { generateUniqId } from '@testring/utils';

import { TestWorkerLocal } from './test-worker-local';
import { devtoolExecutionWrapper } from '@testring/devtool-execution-plugin';
import {
    buildDependencyDictionary,
    buildDependencyDictionaryFromFile,
    mergeDependencyDict,
} from '@testring/dependencies-builder';


const WORKER_ROOT = require.resolve(
    path.resolve(__dirname, 'worker')
);

const WORKER_DEFAULT_CONFIG: ITestWorkerConfig = {
    screenshots: 'disable',
    devtoolEnabled: false,
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

    private logger = loggerClient.withPrefix('[test-worker-instance]');

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
    ): Promise<ITestExecutionMessage> {
        const additionalFiles = await this.beforeCompile([], file.path, file.source);

        this.logger.debug(`Compile source file ${file.path}`);
        let dependencies = await buildDependencyDictionaryFromFile({
            ...file,
            transpiledSource: await this.compileSource(file.source, file.path),
        }, this.readDependency.bind(this));

        for (let i = 0, len = additionalFiles.length; i < len; i++) {
            const filepath = additionalFiles[i];

            if (filepath) {
                const additionalDependencies = await buildDependencyDictionary(
                    filepath,
                    this.readDependency.bind(this),
                    dependencies
                );

                dependencies = await mergeDependencyDict(dependencies, additionalDependencies);
            }
        }

        return {
            entryPath: file.path,
            devtoolEnabled: this.config.devtoolEnabled,
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
            if (this.config.devtoolEnabled) {
                source = await devtoolExecutionWrapper(source, filename);
            }

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

        worker.stdout.on('data', (data) => {
            this.logger.log(`[${this.getWorkerID()}] [logged] ${data.toString().trim()}`);
        });

        worker.stderr.on('data', (data) => {
            this.logger.error(`[${this.getWorkerID()}] [error] ${data.toString().trim()}`);
        });

        worker.on('error', this.workerErrorHandler);
        worker.once('exit', this.workerExitHandler);

        this.transport.registerChild(this.getWorkerID(), worker);

        this.logger.debug(`Registered child process ${this.getWorkerID()}`);

        return worker;
    }

    private async readDependency(dependencyPath: string): Promise<DependencyFileReaderResult> {
        const rawFile = await this.fsReader.readFile(dependencyPath);
        const source = rawFile ? rawFile.source : '';

        return {
            source,
            transpiledSource: await this.compileSource(source, dependencyPath),
        };
    }

    private clearWorkerHandlers() {
        if (this.worker === null) {
            return;
        }

        this.worker.removeListener('error', this.workerErrorHandler);
        this.worker.removeListener('exit', this.workerExitHandler);
    }
}
