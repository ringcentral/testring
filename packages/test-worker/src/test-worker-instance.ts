import * as path from 'path';
import { ChildProcess } from 'child_process';
import { IFile } from '@testring/types';
import { loggerClientLocal } from '@testring/logger';
import { fork } from '@testring/child-process';
import { DependencyDictionary } from '@testring/dependencies-builder';
import { FSReader } from '@testring/fs-reader';
import {
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

export class TestWorkerInstance implements ITestWorkerInstance {

    private fsReader = new FSReader();

    private compileCache: Map<string, string> = new Map();

    private abortTestExecution: Function | null = null;

    private worker: ChildProcess | null = null;

    private queuedWorker: Promise<ChildProcess> | null = null;

    private workerID = `worker/${nanoid()}`;

    private config: ITestWorkerConfig = { debug: false };

    constructor(
        private transport: ITransport,
        private compile: FileCompiler,
        private beforeCompile: (paths: Array<string>) => Promise<Array<string>>,
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

    public kill(signal: NodeJS.Signals = 'SIGTERM') {
        if (this.queuedWorker !== null) {
            this.queuedWorker.then(() => {
                this.kill(signal);
            });
            loggerClientLocal.debug(`Waiting for queue ${this.workerID}`);
        } else if (this.worker !== null) {
            this.worker.kill(signal);
            this.worker = null;
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

        let compiledFile;

        const initialFilePaths = [ file.path ];

        const filePaths = await this.beforeCompile(initialFilePaths);

        const files = await Promise.all(
            filePaths.map(async (path) => {
                if (path && path === file.path) {
                    return file;
                }

                return await this.fsReader.readFile(path);
            })
        );

        const compactedFiles: Array<IFile> = files.filter((file): file is IFile => !!file);

        const compiledFiles = await Promise.all(
            compactedFiles.map(async ({ path, content }) => {
                const compiledContent = await this.compileSource(content, path);

                const result = {
                    path,
                    content: compiledContent,
                };

                if (path === file.path) {
                    compiledFile = result;
                }

                return result;
            }),
        );

        const dependencyDictionary = new DependencyDictionary(this.readDependency.bind(this));

        const dependencies = await dependencyDictionary.build(compiledFiles);
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

                this.abortTestExecution = null;
            }
        );

        this.abortTestExecution = (error) => {
            removeListener();
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        };

        await this.transport.send<ITestExecutionMessage>(this.workerID, TestWorkerAction.executeTest, {
            ...compiledFile,
            dependencies,
            parameters,
            envParameters
        });
        //await this.kill();
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
            this.queuedWorker = this.createWorker().then((worker) => {
                this.worker = worker;
                this.queuedWorker = null;
                return Promise.resolve(worker);
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

        worker.on('close', (exitCode) => {
            if (this.abortTestExecution !== null) {
                this.abortTestExecution(
                    exitCode ?
                        new Error(`[${this.workerID}] unexpected worker shutdown.`) :
                        null
                );
                this.abortTestExecution = null;
            }
        });

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
