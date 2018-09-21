import * as path from 'path';
import { ChildProcess } from 'child_process';
import { loggerClientLocal } from '@testring/logger';
import { FSReader } from '@testring/fs-reader';
import { fork } from '@testring/child-process';
import {
    buildDependencyDictionary,
    mergeDependencyDictionaries
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
    TestStatus
} from '@testring/types';

const nanoid = require('nanoid');

const WORKER_ROOT = require.resolve(
    path.resolve(__dirname, 'worker')
);

function delay(timeout) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));
}

export class TestWorkerInstance implements ITestWorkerInstance {

    private fsReader = new FSReader();

    private compileCache: Map<string, string> = new Map();

    private successTestExecution: Function | null = null;

    private abortTestExecution: Function | null = null;

    private worker: ChildProcess | null = null;

    private queuedWorker: Promise<ChildProcess> | null = null;

    private workerID = `worker/${nanoid()}`;

    private config: ITestWorkerConfig = {
        screenshots: 'disabled',
        debug: false
    };

    private workerExitHandler = (exitCode) => {
        this.worker = null;

        if (this.abortTestExecution !== null) {
            this.abortTestExecution(
                new Error(`[${this.workerID}] unexpected worker shutdown. Exit Code: ${exitCode}`)
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
        this.config = {
            ...this.config,
            ...workerConfig
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
        let error = new Error('Debug error');
        loggerClientLocal.debug('============================DEBUG======================');
        loggerClientLocal.debug(error);
        loggerClientLocal.debug('============================DEBUG======================');

        if (this.queuedWorker !== null) {
            await this.queuedWorker;

            // Dirty hack for correct handling queued worker resolving.
            // Adds gap between microtasks chain,
            // that helps to execute sync code in "makeExecutionRequest" before this
            await delay(100);
            await this.kill(signal);

            loggerClientLocal.debug(`Waiting for queue ${this.workerID}`);
        } else if (this.worker !== null) {
            this.worker.removeListener('error', this.workerErrorHandler);
            this.worker.removeListener('exit', this.workerExitHandler);
            this.worker.kill(signal);
            this.worker = null;

            if (this.successTestExecution !== null) {
                this.successTestExecution();

                this.successTestExecution = null;
                this.abortTestExecution = null;
            }

            loggerClientLocal.debug(`Killed child process ${this.workerID}`);
        }
    }

    private async makeExecutionRequest(
        file: IFile,
        parameters: any,
        envParameters: any,
        resolve,
        reject
    ) {
        this.worker = await this.getWorker();

        const additionalFiles = await this.beforeCompile([], file.path, file.content);

        // Calling external hooks to compile source
        const compiledSource = await this.compileSource(file.content, file.path);
        // TODO implement code instrumentation here

        const compiledFile = {
            path: file.path,
            content: compiledSource
        };

        let dependencies = await buildDependencyDictionary(compiledFile, this.readDependency.bind(this));

        for (let i = 0, len = additionalFiles.length; i < len; i++) {
            const file = await this.fsReader.readFile(additionalFiles[i]);

            if (file) {
                const additionalDependencies = await buildDependencyDictionary(file, this.readDependency.bind(this));

                dependencies = await mergeDependencyDictionaries(dependencies, additionalDependencies);
            }
        }

        const relativePath = path.relative(process.cwd(), file.path);

        loggerClientLocal.debug(`Sending test for execution: ${relativePath}`);

        const removeListener = this.transport.onceFrom<ITestExecutionCompleteMessage>(
            this.workerID,
            TestWorkerAction.executionComplete,
            (message) => {
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
            }
        );

        this.successTestExecution = () => {
            removeListener();
            resolve();
        };

        this.abortTestExecution = (error) => {
            removeListener();
            reject(error);
        };

        await this.transport.send<ITestExecutionMessage>(this.workerID, TestWorkerAction.executeTest, {
            ...compiledFile,
            dependencies,
            parameters,
            envParameters
        });
    }

    private async compileSource(source: string, filename: string): Promise<string> {
        const cachedSource = this.compileCache.get(source);

        if (cachedSource) {
            return cachedSource;
        }

        try {
            loggerClientLocal.debug(`Compile source file ${filename}`);

            const compiledSource = await this.compile(source, filename);

            this.compileCache.set(source, compiledSource);

            return compiledSource;
        } catch (error) {
            loggerClientLocal.error(`Compilation ${filename} failed`);

            throw error;
        }
    }

    private async getWorker(): Promise<ChildProcess> {
        if (this.queuedWorker) {
            return this.queuedWorker;
        }

        if (this.worker === null) {
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

    private async createWorker(): Promise<ChildProcess> {
        const worker = await fork(WORKER_ROOT, [], this.config.debug);

        worker.stdout.on('data', (data) => {
            loggerClientLocal.log(`[${this.workerID}] [logged] ${data.toString().trim()}`);
        });

        worker.stderr.on('data', (data) => {
            loggerClientLocal.error(`[${this.workerID}] [error] ${data.toString().trim()}`);
        });

        worker.on('error', this.workerErrorHandler);
        worker.on('exit', this.workerExitHandler);

        this.transport.registerChildProcess(this.workerID, worker);

        loggerClientLocal.debug(`Registered child process ${this.workerID}`);

        return worker;
    }

    private async readDependency(dependencyPath: string): Promise<string> {
        const rawFile = await this.fsReader.readFile(dependencyPath);
        const rawContent = rawFile ? rawFile.content : '';

        return this.compile(rawContent, dependencyPath);
    }
}
