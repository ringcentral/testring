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

const delay = (timeout: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, timeout));

export class TestWorkerInstance implements ITestWorkerInstance {
    private config: ITestWorkerConfig;

    private compileCache: Map<string, string> = new Map();

    private successTestExecution: Function | null = null;

    private abortTestExecution: Function | null = null;

    private worker: IWorkerEmitter | null = null;

    private queuedWorker: Promise<IWorkerEmitter> | null = null;

    private workerID = `worker/${generateUniqId()}`;

    private logger = loggerClient;

    private fsWriterClient: FSStoreClient;

    private workerExitHandler = (exitCode: any) => {
        this.clearWorkerHandlers();
        this.fsWriterClient.releaseAllWorkerActions();
        this.worker = null;

        if (this.abortTestExecution !== null) {
            this.abortTestExecution(
                new Error(
                    `[${this.getWorkerID()}] unexpected worker shutdown. Exit Code: ${exitCode}`,
                ),
            );

            this.successTestExecution = null;
            this.abortTestExecution = null;
        }
    };

    private workerErrorHandler = (error: any) => {
        this.fsWriterClient.releaseAllWorkerActions();
        if (this.abortTestExecution !== null) {
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
        return new Promise((resolve, reject) => {
            this.makeExecutionRequest(file, parameters, envParameters, (err) =>
                err ? reject(err) : resolve(),
            ).catch(reject);
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

            const waitForKill = new Promise<void>((resolve) => {
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

            // Rotate the worker ID now, so any respawn triggered by a
            // subsequent execute() call (and any hook meta read before that
            // respawn happens) reflects the new underlying child process
            // rather than the one that was just killed (FR-014/FR-017).
            this.workerID = `worker/${generateUniqId()}`;
        }
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
        } else if (this.config.localWorker) {
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
