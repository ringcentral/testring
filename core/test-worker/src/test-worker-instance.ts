import * as path from 'path';
import {loggerClient} from '@testring/logger';
import {FSStoreClient, FSClientGet} from '@testring/fs-store';
import {fork} from '@testring/child-process';
import {generateUniqId} from '@testring/utils';
import {TestWorkerLocal} from './test-worker-local';
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

const WORKER_ROOT = require.resolve(path.resolve(__dirname, 'worker'));

const WORKER_DEFAULT_CONFIG: ITestWorkerConfig = {
    screenshots: 'disable',
    waitForRelease: false,
    localWorker: false,
};

const TERMINATION_TIMEOUT = 5000;

export class TestWorkerInstance implements ITestWorkerInstance {
    private config: ITestWorkerConfig;

    private compileCache: Map<string, string> = new Map();

    private successTestExecution: Function | null = null;

    private abortTestExecution: Function | null = null;

    private worker: IWorkerEmitter | null = null;

    private queuedWorker: Promise<IWorkerEmitter> | null = null;

    private terminationPromise: Promise<void> | null = null;

    private terminationInProgress = false;

    private terminationError: Error | null = null;

    private executionSetup: Promise<void> | null = null;

    private workerID = `worker/${generateUniqId()}`;

    private logger = loggerClient;

    private fsWriterClient: FSStoreClient;

    private workerExitHandler = (exitCode: any) => {
        this.clearWorkerHandlers();
        this.fsWriterClient.releaseAllWorkerActions();
        this.worker = null;

        if (this.abortTestExecution !== null) {
            if (this.terminationInProgress) {
                this.successTestExecution?.();
            } else {
                this.abortTestExecution(
                    new Error(
                        `[${this.getWorkerID()}] unexpected worker shutdown. Exit Code: ${exitCode}`,
                    ),
                );
            }

            this.successTestExecution = null;
            this.abortTestExecution = null;
        }
    };

    private workerErrorHandler = (error: any) => {
        this.fsWriterClient.releaseAllWorkerActions();
        if (!this.terminationInProgress && this.abortTestExecution !== null) {
            this.abortTestExecution(error);

            this.successTestExecution = null;
            this.abortTestExecution = null;
        }
    };

    constructor(
        private transport: ITransport,
        private compile: FileCompiler,
        private beforeCompile: (
            paths: Array<string>,
            filePath: string,
            fileContent: string,
        ) => Promise<Array<string>>,
        workerConfig: Partial<ITestWorkerConfig> = {},
    ) {
        this.config = this.createConfig(workerConfig);
        this.fsWriterClient = FSClientGet();
    }

    private createConfig(
        workerConfig: Partial<ITestWorkerConfig>,
    ): ITestWorkerConfig {
        return {
            ...WORKER_DEFAULT_CONFIG,
            ...workerConfig,
        };
    }

    public async execute(
        file: IFile,
        parameters: any,
        envParameters: any,
    ): Promise<void> {
        if (this.terminationError) {
            throw this.terminationError;
        }

        return new Promise((resolve, reject) => {
            const setup = this.makeExecutionRequest(file, parameters, envParameters, (err) =>
                err ? reject(err) : resolve(),
            );
            this.executionSetup = setup;
            setup.then(
                () => {
                    if (this.executionSetup === setup) {
                        this.executionSetup = null;
                    }
                },
                (error) => {
                    if (this.executionSetup === setup) {
                        this.executionSetup = null;
                    }
                    reject(error);
                },
            );
        });
    }

    public getWorkerID() {
        return this.workerID;
    }

    public kill(signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
        if (this.terminationError) {
            return Promise.reject(this.terminationError);
        }

        if (!this.terminationPromise) {
            this.terminationPromise = this.terminate(signal);
            this.terminationPromise.then(
                () => (this.terminationPromise = null),
                () => (this.terminationPromise = null),
            );
        }

        return this.terminationPromise;
    }

    private async terminate(signal: NodeJS.Signals): Promise<void> {
        const workerID = this.getWorkerID();
        const deadline = Date.now() + TERMINATION_TIMEOUT;
        this.terminationInProgress = true;

        try {
            if (this.queuedWorker) {
                await this.withTerminationDeadline(
                    this.queuedWorker,
                    deadline,
                    workerID,
                    signal,
                );
            }

            if (this.executionSetup) {
                await this.withTerminationDeadline(
                    this.executionSetup,
                    deadline,
                    workerID,
                    signal,
                );
            }

            const worker = this.worker;
            if (!worker) {
                return;
            }

            await this.waitForWorkerExit(
                worker,
                deadline,
                workerID,
                signal,
            );

            this.logger.debug(`Killed child process ${workerID}`);
            this.workerID = `worker/${generateUniqId()}`;
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            const terminationError = new Error(
                `[${workerID}] failed to terminate with ${signal}: ${reason}`,
            );
            this.terminationError = terminationError;
            this.fsWriterClient.releaseAllWorkerActions();
            this.abortTestExecution?.(terminationError);
            this.successTestExecution = null;
            this.abortTestExecution = null;
            throw terminationError;
        } finally {
            this.terminationInProgress = false;
        }
    }

    private withTerminationDeadline<T>(
        promise: Promise<T>,
        deadline: number,
        workerID: string,
        signal: NodeJS.Signals,
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(
                () =>
                    reject(
                        new Error(
                            `termination timed out after ${TERMINATION_TIMEOUT}ms for ${workerID} (${signal})`,
                        ),
                    ),
                Math.max(0, deadline - Date.now()),
            );
            promise.then(
                (value) => {
                    clearTimeout(timer);
                    resolve(value);
                },
                (error) => {
                    clearTimeout(timer);
                    reject(error);
                },
            );
        });
    }

    private waitForWorkerExit(
        worker: IWorkerEmitter,
        deadline: number,
        workerID: string,
        signal: NodeJS.Signals,
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                cleanup();
                reject(
                    new Error(
                        `termination timed out after ${TERMINATION_TIMEOUT}ms for ${workerID} (${signal})`,
                    ),
                );
            }, Math.max(0, deadline - Date.now()));
            const onExit = () => {
                cleanup();
                resolve();
            };
            const onError = (error: Error) => {
                cleanup();
                reject(error);
            };
            const cleanup = () => {
                clearTimeout(timer);
                worker.removeListener('exit', onExit);
                worker.removeListener('error', onError);
            };

            worker.once('exit', onExit);
            worker.once('error', onError);

            try {
                if ((worker.kill(signal) as unknown) === false) {
                    cleanup();
                    reject(new Error('worker refused the termination signal'));
                }
            } catch (error) {
                cleanup();
                reject(error);
            }
        });
    }

    private async getExecutionPayload(
        file: IFile,
        parameters: any,
        envParameters: any,
    ) {
        // beforeCompile/compile remain as generic plugin extensibility
        // hooks (e.g. a future non-Babel source-transform plugin); both are
        // no-op passthroughs today since no plugin registers either
        // TestWorkerPlugin hook anymore. Their former sole purpose — paths
        // buildDependencyDictionary consumed to build a static require()
        // dictionary for the (now-deleted) sandbox — no longer applies:
        // native ESM resolves its own dependency graph at runtime.
        await this.beforeCompile([], file.path, file.content);

        const compiledSource = await this.compileSource(
            file.content,
            file.path,
        );

        return {
            waitForRelease: this.config.waitForRelease,
            path: file.path,
            content: compiledSource,
            parameters,
            envParameters,
            workerId: this.getWorkerID(),
        };
    }

    private async makeExecutionRequest(
        file: IFile,
        parameters: any,
        envParameters: any,
        callback: (err?: Error) => void,
    ): Promise<void> {
        const worker = await this.initWorker();

        if (this.terminationError) {
            throw this.terminationError;
        }

        const relativePath = path.relative(process.cwd(), file.path);

        let payload;
        try {
            payload = await this.getExecutionPayload(
                file,
                parameters,
                envParameters,
            );
        } catch (err) {
            callback(err as Error);
            return;
        }

        this.logger.debug(`Sending test for execution: ${relativePath}`);

        const completeHandler = (message: ITestExecutionCompleteMessage) => {
            switch (message.status) {
                case TestStatus.done:
                    callback();
                    break;

                case TestStatus.failed:
                    callback(message.error || new Error("Unknown error"));
                    break;
            }

            this.successTestExecution = null;
            this.abortTestExecution = null;
        };

        let removeListener;
        if (this.config.localWorker) {
            removeListener = this.transport.once<ITestExecutionCompleteMessage>(
                TestWorkerAction.executionComplete,
                completeHandler,
            );
        } else {
            removeListener =
                this.transport.onceFrom<ITestExecutionCompleteMessage>(
                    this.getWorkerID(),
                    TestWorkerAction.executionComplete,
                    completeHandler,
                );
        }

        this.successTestExecution = () => {
            removeListener();
            callback();
        };

        this.abortTestExecution = (error: Error | undefined) => {
            removeListener();
            callback(error);
        };

        if (this.config.localWorker) {
            await worker.send({type: TestWorkerAction.executeTest, payload});
        } else {
            await this.transport.send<ITestExecutionMessage>(
                this.getWorkerID(),
                TestWorkerAction.executeTest,
                payload,
            );
        }
    }

    private async compileSource(
        source: string,
        filename: string,
    ): Promise<string> {
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
        } else if (this.config.localWorker && this.worker === null) {
            this.queuedWorker = this.createLocalWorker().then((worker) => {
                this.worker = worker;
                this.queuedWorker = null;

                return worker;
            });

            return this.queuedWorker;
        } else if (this.worker === null) {
            this.queuedWorker = this.createWorker()
                // eslint-disable-next-line sonarjs/no-identical-functions
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
                this.logger.log(
                    `[${this.getWorkerID()}] [logged] ${data
                        .toString()
                        .trim()}`,
                );
            });
        } else {
            this.logger.warn(
                `[${this.getWorkerID()}] The STDOUT of worker ${this.getWorkerID()} is null`,
            );
        }

        if (worker.stderr) {
            worker.stderr.on('data', (data) => {
                this.logger.error(
                    `[${this.getWorkerID()}] [error] ${data.toString().trim()}`,
                );
            });
        } else {
            this.logger.warn(
                `[${this.getWorkerID()}] The STDERR of worker ${this.getWorkerID()} is null`,
            );
        }

        worker.on('error', this.workerErrorHandler);
        worker.once('exit', this.workerExitHandler);

        this.transport.registerChild(this.getWorkerID(), worker);

        this.logger.debug(`Registered child process ${this.getWorkerID()}`);

        return worker;
    }

    private clearWorkerHandlers() {
        if (this.worker === null) {
            return;
        }

        this.worker.removeListener('error', this.workerErrorHandler);
        this.worker.removeListener('exit', this.workerExitHandler);
    }
}
