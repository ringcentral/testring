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
    TestCompiler,
    TestStatus
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
        return new Promise(async (resolve, reject) => {
            try {
                return await this.makeExecutionRequest(rawSource, filename, parameters, resolve, reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    public kill() {
        if (this.worker !== null) {
            this.worker.kill();
            loggerClientLocal.debug(`Killed child process ${this.workerName}`);
            this.worker = null;
        }
    }

    private async makeExecutionRequest(rawSource: string, filename: string, parameters: object, resolve, reject) {
        if (this.worker === null) {
            this.worker = this.createWorker();
        }

        // Calling external hooks to compile source
        const compiledSource = await this.compileSource(rawSource, filename);

        // TODO implement code instrumentation here

        const testData = {
            source: compiledSource,
            filename,
            parameters
        };

        const relativePath = path.relative(process.cwd(), filename);

        loggerClientLocal.debug(`Sending test for execution: ${relativePath}`);

        const removeListener = this.transport.onceFrom<ITestExecutionCompleteMessage>(
            this.workerName,
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

        this.abortTestExecution = () => {
            loggerClientLocal.error('Aborted test execution');
            removeListener();
            reject();
        };

        await this.transport.send<ITestExecutionMessage>(this.workerName, TestWorkerAction.executeTest, testData);
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

    private createWorker(): ChildProcess {
        const worker = fork(WORKER_ROOT);

        worker.stdout.on('data', (data) => {
            loggerClientLocal.log(`[${this.workerName}] [logged] ${data.toString().trim()}`);
        });

        worker.stderr.on('data', (data) => {
            loggerClientLocal.error(`[${this.workerName}] [error] ${data.toString().trim()}`);
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
