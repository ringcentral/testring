import * as path from 'path';
import { ChildProcess } from 'child_process';
import { loggerClientLocal } from '@testring/logger';
import { fork } from '@testring/child-process';
import {
    ITransport,
    ITestWorkerInstance,
    ITestExecutionCompleteMessage,
    ITestExecutionMessage,
    TestWorkerAction,
    TestCompiler
} from '@testring/types';

const nanoid = require('nanoid');

const WORKER_ROOT = require.resolve(
    path.resolve(__dirname, 'worker')
);

export class TestWorkerInstance implements ITestWorkerInstance {

    private compileCache: Map<string, string> = new Map();

    private abortTestExecution: Function | null = null;

    private worker: ChildProcess | null = null;

    private workerName = `worker/${nanoid()}`;

    constructor(
        private transport: ITransport,
        private compile: TestCompiler
    ) {
    }

    public async execute(rawSource: string, filename: string, parameters: object): Promise<any> {
        if (this.worker === null) {
            this.worker = this.createWorker();
        }

        // TODO add cache
        // Calling external hooks to compile source
        const compiledSource = await this.compileSource(rawSource, filename);

        // TODO implement code instrumentation here

        const testData = {
            source: compiledSource,
            filename,
            parameters
        };

        const relativePath = path.relative(process.cwd(), filename);

        loggerClientLocal.log(`Running test: ${relativePath}`);

        return new Promise(async (resolve, reject) => {
            const removeListener = this.transport.onceFrom(this.workerName, TestWorkerAction.executionComplete,
                (message: ITestExecutionCompleteMessage) => {
                    if (message.error) {
                        loggerClientLocal.error(`Test failed: ${relativePath}\n`, message.error);

                        reject({
                            error: message.error,
                            test: testData
                        });
                    } else {
                        loggerClientLocal.log(`Test success: ${relativePath}`);
                        loggerClientLocal.debug(`Test result: ${message.status}`);
                        resolve();
                    }

                    this.abortTestExecution = null;
                }
            );

            this.abortTestExecution = () => {
                loggerClientLocal.error('Aborted test execution');
                removeListener();
                reject();
            };
            loggerClientLocal.debug('Executing test ...');
            this.makeRequest(TestWorkerAction.executeTest, testData);
        });
    }

    public kill() {
        if (this.worker !== null) {
            this.worker.kill();
            loggerClientLocal.debug(`Killed child process ${this.workerName}`);
            this.worker = null;
        }
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

            throw {
                error,
                test: {
                    source,
                    filename
                }
            };
        }
    }

    private makeRequest(requestName: string, data: ITestExecutionMessage) {
        return this.transport.send(this.workerName, requestName, data);
    }

    private createWorker(): ChildProcess {
        const worker = fork(WORKER_ROOT);

        worker.stdout.on('data', (data) => {
            loggerClientLocal.log(`[${this.workerName}] [logged] ${data.toString().trim()}`);
        });

        worker.stderr.on('data', (data) => {
            loggerClientLocal.log(`[${this.workerName}] [error] ${data.toString().trim()}`);
        });

        worker.on('close', (error) => {
            if (this.abortTestExecution !== null) {
                this.abortTestExecution(error);
                this.abortTestExecution = null;
            }
        });

        this.transport.registerChildProcess(this.workerName, worker);
        loggerClientLocal.debug(`Registered child process ${this.workerName}`);

        return worker;
    }
}
