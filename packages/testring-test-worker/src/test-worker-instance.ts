import * as path from 'path';
import { ChildProcess } from 'child_process';
import { loggerClientLocal } from '@testring/logger';
import { fork } from '@testring/child-process';
import { ITransport } from '@testring/types';
import { IExecutionCompleteMessage, IExecutionMessage } from '../interfaces';
import { WorkerAction } from './constants';

const nanoid = require('nanoid');

type Compiler = (source: string, filename: string) => Promise<string>;

const WORKER_ROOT = require.resolve(
    path.resolve(__dirname, 'worker')
);

export class TestWorkerInstance {

    private abortTestExecution: Function | null = null;

    private workerName = `worker/${nanoid()}`;

    private worker: ChildProcess | null = null;

    constructor(
        private transport: ITransport,
        private compile: Compiler
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
            const removeListener = this.transport.onceFrom(this.workerName, WorkerAction.executionComplete,
                (message: IExecutionCompleteMessage) => {
                    if (message.error) {
                        loggerClientLocal.error(`Test failed: ${relativePath}\n`, message.error);

                        reject({
                            error: message.error,
                            test: testData
                        });
                    } else {
                        loggerClientLocal.log(`Test success: ${relativePath}`);

                        resolve();
                    }

                    this.abortTestExecution = null;
                }
            );

            this.abortTestExecution = () => {
                removeListener();
                reject();
            };

            this.makeRequest(WorkerAction.executeTest, testData);
        });
    }

    public kill() {
        if (this.worker !== null) {
            this.worker.kill();
            this.worker = null;
        }
    }

    private async compileSource(source: string, filename: string): Promise<string> {
        try {
            return await this.compile(source, filename);
        } catch (error) {
            throw {
                error,
                test: {
                    source,
                    filename
                }
            };
        }
    }

    private makeRequest(requestName: string, data: IExecutionMessage) {
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

        return worker;
    }
}
