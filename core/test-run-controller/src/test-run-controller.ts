import {
    IConfig,
    IFile,
    IQueuedTest,
    IDevtoolRuntimeConfiguration,
    ITestQueuedTestRunData,
    ITestRunController,
    ITestWorker,
    ITestWorkerCallbackMeta,
    ITestWorkerInstance,
    TestRunControllerPlugins,
} from '@testring/types';
import {loggerClient} from '@testring/logger';
import {PluggableModule} from '@testring/pluggable-module';
import {Queue} from '@testring/utils';

type TestQueue = Queue<IQueuedTest>;

const delay = (milliseconds: number) =>
    new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });

export class TestRunController
    extends PluggableModule
    implements ITestRunController
{
    private workers: Array<ITestWorkerInstance> = [];

    private errors: Array<Error> = [];

    private currentQueue: TestQueue | null = null;

    private currentRun: Promise<any> | null = null;

    private logger = loggerClient;

    constructor(
        private config: IConfig,
        private testWorker: ITestWorker,
        private devtoolConfig: IDevtoolRuntimeConfiguration | null = null,
    ) {
        super([
            TestRunControllerPlugins.beforeRun,
            TestRunControllerPlugins.beforeTest,
            TestRunControllerPlugins.afterTest,
            TestRunControllerPlugins.beforeTestRetry,
            TestRunControllerPlugins.afterRun,
            TestRunControllerPlugins.shouldNotExecute,
            TestRunControllerPlugins.shouldNotStart,
            TestRunControllerPlugins.shouldNotRetry,
        ]);
    }

    public async runQueue(testSet: Array<IFile>): Promise<Error[] | null> {
        const testQueue = await this.prepareTests(testSet);

        this.logger.debug('Run controller: tests queue created.');

        this.currentQueue = testQueue;
        this.currentRun = this.executeQueue(this.currentQueue);

        return this.currentRun;
    }

    public async kill(): Promise<void> {
        await Promise.all(this.workers.map((worker) => worker.kill()));

        this.workers.length = 0;

        if (this.currentQueue) {
            this.currentQueue.clean();
        }
    }

    private async executeQueue(testQueue: TestQueue): Promise<Error[] | null> {
        const shouldNotExecute = await this.callHook(
            TestRunControllerPlugins.shouldNotExecute,
            false,
            testQueue,
        );

        if (!!shouldNotExecute) {
            this.logger.info('The run queue execution was stopped.');
            return null;
        }

        try {
            const configWorkerLimit = this.config.workerLimit;

            if (configWorkerLimit === 'local') {
                await this.runLocalWorker(testQueue);
            } else if (
                typeof configWorkerLimit === 'number' &&
                configWorkerLimit > 0
            ) {
                const workerLimit =
                    configWorkerLimit < testQueue.length
                        ? configWorkerLimit
                        : testQueue.length;

                await this.runChildWorkers(testQueue, workerLimit);
            } else {
                throw new Error(
                    `Invalid workerLimit argument value ${configWorkerLimit}`,
                );
            }

            await this.callHook(TestRunControllerPlugins.afterRun, null);
        } catch (error) {
            await this.callHook(TestRunControllerPlugins.afterRun, error);
            this.errors.push(error as Error);
        }

        if (this.errors.length > 0) {
            return this.errors;
        }

        return null;
    }

    private async runLocalWorker(testQueue: TestQueue): Promise<void> {
        this.logger.debug('Run controller: Local worker is used.');

        if (this.config.restartWorker) {
            this.logger.warn('Workers won`t be restarted on every test end.');
        }

        this.workers = this.createWorkers(1);
        const worker = this.workers[0];

        if (!worker) {
            throw new Error('Failed to create a test worker instance.');
        }

        while (testQueue.length > 0) {
            await this.executeWorker(worker, testQueue);
        }
    }

    private async runChildWorkers(
        testQueue: TestQueue,
        workerLimit: number,
    ): Promise<void> {
        this.logger.debug(`Run controller: ${workerLimit} worker(s) created.`);

        this.workers = this.createWorkers(workerLimit);

        await Promise.all(
            this.workers.map(async (worker) => {
                while (testQueue.length > 0) {
                    await this.executeWorker(worker, testQueue);

                    if (this.config.restartWorker) {
                        await worker.kill();
                    }
                }
                await worker.kill();
            }),
        );
    }

    private createWorkers(limit: number): Array<ITestWorkerInstance> {
        const workers: Array<ITestWorkerInstance> = [];

        for (let index = 0; index < limit; index++) {
            workers.push(this.testWorker.spawn());
        }

        return workers;
    }

    private getWorkerMeta(
        worker: ITestWorkerInstance,
    ): ITestWorkerCallbackMeta {
        return {
            processID: worker.getWorkerID(),
            isLocal: this.config.workerLimit === 'local',
        };
    }

    private prepareTest(testFile: IFile): IQueuedTest {
        return {
            retryCount: 0,
            retryErrors: [],
            test: testFile,
            parameters: {},
            envParameters: {
                ...this.config.envParameters,
            },
        };
    }

    private getQueueItemWithRunData(queueItem: IQueuedTest): IQueuedTest {
        let screenshotsEnabled = false;
        const isRetryRun = queueItem.retryCount > 0;
        const {debug, httpThrottle, logLevel, devtool, screenshotPath} =
            this.config;

        if (this.config.screenshots === 'enable') {
            screenshotsEnabled = true;
        } else if (this.config.screenshots === 'afterError') {
            screenshotsEnabled = isRetryRun;
        }

        let devtoolConfig: IDevtoolRuntimeConfiguration | null = null;
        if (devtool) {
            devtoolConfig = this.devtoolConfig;
        }

        const runData: ITestQueuedTestRunData = {
            debug,
            logLevel,
            httpThrottle,
            screenshotsEnabled,
            devtool: devtoolConfig,
            isRetryRun,
            screenshotPath,
        };

        return {
            ...queueItem,
            parameters: {
                ...queueItem.parameters,
                runData,
            },
        };
    }

    private async prepareTests(testFiles: Array<IFile>): Promise<TestQueue> {
        const testQueue = new Array(testFiles.length);

        for (let index = 0; index < testFiles.length; index++) {
            const testFile = testFiles[index];
            if (testFile !== undefined) {
                testQueue[index] = this.prepareTest(testFile);
            }
        }

        const modifierQueue = await this.callHook(
            TestRunControllerPlugins.beforeRun,
            testQueue,
        );

        return new Queue(
            (modifierQueue || []).map((item: IQueuedTest) =>
                this.getQueueItemWithRunData(item),
            ),
        );
    }

    private async onTestFailed(
        error: Error,
        worker: ITestWorkerInstance,
        queueItem: IQueuedTest,
        queue: TestQueue,
    ): Promise<void> {
        if (this.config.bail) {
            await this.callHook(
                TestRunControllerPlugins.afterTest,
                queueItem,
                error,
                this.getWorkerMeta(worker),
            );
            throw error;
        }

        const shouldNotRetry = await this.callHook(
            TestRunControllerPlugins.shouldNotRetry,
            false,
            queueItem,
            this.getWorkerMeta(worker),
        );

        if (
            !shouldNotRetry &&
            queueItem.retryCount < (this.config.retryCount || 0)
        ) {
            await delay(this.config.retryDelay || 0);

            const copyQueueItem = this.getQueueItemWithRunData({
                ...queueItem,
                retryCount: queueItem.retryCount + 1,
            });

            queue.push(copyQueueItem);

            await this.callHook(
                TestRunControllerPlugins.beforeTestRetry,
                queueItem,
                error,
                this.getWorkerMeta(worker),
            );
        } else {
            // Ensure error is properly logged and tracked
            this.logger.error(`Test failed: ${queueItem.test.path}`, error.message);
            this.errors.push(error);

            await this.callHook(
                TestRunControllerPlugins.afterTest,
                queueItem,
                error,
                this.getWorkerMeta(worker),
            );
        }
    }

    private async executeWorker(
        worker: ITestWorkerInstance,
        queue: TestQueue,
    ): Promise<void> {
        const queuedTest = queue.shift();

        if (!queuedTest) {
            return;
        }

        let timer;
        let isRejectedByTimeout = false;

        try {
            const timeout =
                queuedTest.parameters.testTimeout || this.config.testTimeout;

            const shouldNotStart = await this.callHook(
                TestRunControllerPlugins.shouldNotStart,
                false,
                queuedTest,
                this.getWorkerMeta(worker),
            );

            if (!!shouldNotStart) {
                return;
            }

            await this.callHook(
                TestRunControllerPlugins.beforeTest,
                queuedTest,
                this.getWorkerMeta(worker),
            );

            const raceQueue = [
                worker.execute(
                    queuedTest.test,
                    queuedTest.parameters,
                    queuedTest.envParameters,
                ),
            ];

            if (timeout > 0) {
                raceQueue.push(
                    new Promise((_resolve, reject) => {
                        timer = setTimeout(() => {
                            isRejectedByTimeout = true;
                            reject(
                                new Error(`Test timeout exceeded ${timeout}ms`),
                            );
                        }, timeout);
                    }),
                );
            }

            await Promise.race(raceQueue);

            // noinspection JSUnusedAssignment
            clearTimeout(timer);

            await this.callHook(
                TestRunControllerPlugins.afterTest,
                queuedTest,
                null,
                this.getWorkerMeta(worker),
            );
        } catch (error) {
            if (isRejectedByTimeout) {
                await worker.kill('SIGABRT');
            }

            queuedTest.retryErrors.push(error);
            // noinspection JSUnusedAssignment
            clearTimeout(timer);

            await this.onTestFailed(error as Error, worker, queuedTest, queue);
        }
    }
}
