import {
    IConfig,
    IFile,
    IQueuedTest,
    ITestRunController,
    ITestWorker,
    ITestWorkerCallbackMeta,
    ITestWorkerInstance,
    TestRunControllerPlugins,
} from '@testring/types';
import { loggerClient } from '@testring/logger';
import { PluggableModule } from '@testring/pluggable-module';
import { Queue, getMemoryReport } from '@testring/utils';

type TestQueue = Queue<IQueuedTest>;

const delay = (milliseconds: number) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
});

export class TestRunController extends PluggableModule implements ITestRunController {

    private workers: Array<ITestWorkerInstance> = [];

    private errors: Array<Error> = [];

    private currentQueue: TestQueue | null = null;

    private currentRun: Promise<any> | null = null;

    private logger = loggerClient;

    constructor(
        private config: IConfig,
        private testWorker: ITestWorker
    ) {
        super([
            TestRunControllerPlugins.beforeRun,
            TestRunControllerPlugins.beforeTest,
            TestRunControllerPlugins.afterTest,
            TestRunControllerPlugins.beforeTestRetry,
            TestRunControllerPlugins.afterRun,
            TestRunControllerPlugins.shouldRetry
        ]);
    }

    public async pushTestIntoQueue(testString: string) {
        const testQueueItem = this.prepareTest({
            path: '',
            content: testString
        });
        if (Array.isArray(this.currentQueue)) {
            this.currentQueue.push(testQueueItem);
        } else {
            this.currentQueue = new Queue([testQueueItem]);
            this.currentRun = this.executeQueue(this.currentQueue);
        }

        return this.currentRun;
    }

    public async runQueue(testSet: Array<IFile>): Promise<Error[] | null> {
        const testQueue = await this.prepareTests(testSet);

        this.logger.debug('Run controller: tests queue created.');

        if (Array.isArray(this.currentQueue)) {
            this.currentQueue.push(...testQueue);
        } else {
            this.currentQueue = testQueue;
            this.currentRun = this.executeQueue(this.currentQueue);
        }

        return this.currentRun;
    }

    public async kill(): Promise<void> {
        await Promise.all(
            this.workers.map((worker) => worker.kill())
        );

        this.workers.length = 0;

        if (this.currentQueue) {
            this.currentQueue.clean();
        }
    }

    private async executeQueue(testQueue: TestQueue): Promise<Error[] | null> {
        try {
            const configWorkerLimit = this.config.workerLimit;

            if (configWorkerLimit === 'local') {
                await this.runLocalWorker(testQueue);
            } else if (typeof configWorkerLimit === 'number') {
                const workerLimit = configWorkerLimit < testQueue.length ? configWorkerLimit : testQueue.length;

                await this.runChildWorkers(testQueue, workerLimit);
            } else {
                throw new Error(`Invalid workerLimit argument value ${configWorkerLimit}`);
            }

            await this.callHook(TestRunControllerPlugins.afterRun, null);
        } catch (error) {
            await this.callHook(TestRunControllerPlugins.afterRun, error);
            this.errors.push(error);
        }


        if (this.errors.length > 0) {
            return this.errors;
        }

        return null;
    }

    private async runLocalWorker(testQueue: TestQueue): Promise<void> {
        this.logger.debug('Run controller: Local worker is using.');

        try {
            this.workers = this.createWorkers(1);
            const worker = this.workers[0];

            while (testQueue.length > 0) {
                await this.executeWorker(worker, testQueue);
            }
            this.logger.debug(`Parent process memory usage after test execution. ${getMemoryReport()}`);
        } catch (error) {
            throw error;
        } finally {
            this.workers = [];
        }
    }

    private async runChildWorkers(testQueue: TestQueue, workerLimit: number): Promise<void> {
        this.logger.debug(`Run controller: ${workerLimit} worker(s) created.`);
        this.logger.debug(`Parent process memory usage before execution. ${getMemoryReport()}`);

        try {
            this.workers = this.createWorkers(workerLimit);

            await Promise.all(
                this.workers.map(async (worker) => {
                    while (testQueue.length > 0) {
                        await this.executeWorker(worker, testQueue);
                        this.logger.debug(`Parent process memory usage after test execution. ${getMemoryReport()}`);

                        if (this.config.restartWorker === 'always') {
                            await worker.kill();
                        }
                    }
                    await worker.kill();
                })
            );

        } catch (error) {
            throw error;
        } finally {
            this.workers = [];
            this.currentQueue = null;
        }
    }

    private createWorkers(limit: number): Array<ITestWorkerInstance> {
        const workers: Array<ITestWorkerInstance> = [];

        for (let index = 0; index < limit; index++) {
            workers.push(this.testWorker.spawn());
        }

        return workers;
    }

    private getWorkerMeta(worker: ITestWorkerInstance): ITestWorkerCallbackMeta {
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

    private getQueueItemWithRunData(queueItem): IQueuedTest {
        let screenshotsEnabled = false;
        let isRetryRun = queueItem.retryCount > 0;
        const {
            debug,
            logLevel,
            httpThrottle,
        } = this.config;

        if (this.config.screenshots === 'enable') {
            screenshotsEnabled = true;
        } else if (this.config.screenshots === 'afterError') {
            screenshotsEnabled = isRetryRun;
        }

        return {
            ...queueItem,
            parameters: {
                ...queueItem.parameters,
                runData: {
                    debug,
                    logLevel,
                    httpThrottle,
                    screenshotsEnabled,
                    isRetryRun,
                },
            },
        };
    }

    private async prepareTests(testFiles: Array<IFile>): Promise<TestQueue> {
        const testQueue = new Array(testFiles.length);

        for (let index = 0; index < testFiles.length; index++) {
            testQueue[index] = this.prepareTest(testFiles[index]);
        }

        const modifierQueue = await this.callHook(TestRunControllerPlugins.beforeRun, testQueue);

        return new Queue((modifierQueue || []).map(item => this.getQueueItemWithRunData(item)));
    }

    private async onTestFailed(
        error: Error,
        worker: ITestWorkerInstance,
        queueItem: IQueuedTest,
        queue: TestQueue
    ): Promise<void> {
        if (this.config.bail) {
            await this.callHook(TestRunControllerPlugins.afterTest, queueItem, error, this.getWorkerMeta(worker));
            throw error;
        }

        const shouldRetry = await this.callHook(
            TestRunControllerPlugins.shouldRetry,
            queueItem.test.path,
            this.getWorkerMeta(worker)
        );

        if (
            !!shouldRetry &&
            queueItem.retryCount < (this.config.retryCount || 0)
        ) {
            await delay(this.config.retryDelay || 0);

            let copyQueueItem = this.getQueueItemWithRunData({
                ...queueItem,
                retryCount: queueItem.retryCount + 1,
            });

            queue.push(copyQueueItem);

            await this.callHook(TestRunControllerPlugins.beforeTestRetry, queueItem, error, this.getWorkerMeta(worker));
        } else {
            this.errors.push(error);

            await this.callHook(TestRunControllerPlugins.afterTest, queueItem, error, this.getWorkerMeta(worker));
        }
    }

    private async executeWorker(worker: ITestWorkerInstance, queue: TestQueue): Promise<void> {
        const queuedTest = queue.shift();

        if (!queuedTest) {
            return;
        }

        let timer;
        let isRejectedByTimeout = false;

        try {
            const timeout = queuedTest.parameters.testTimeout || this.config.testTimeout;

            await this.callHook(TestRunControllerPlugins.beforeTest, queuedTest, this.getWorkerMeta(worker));

            const raceQueue = [
                worker.execute(
                    queuedTest.test,
                    queuedTest.parameters,
                    queuedTest.envParameters
                ),
            ];

            if (timeout > 0) {
                raceQueue.push(
                    new Promise((resolve, reject) => {
                        timer = setTimeout(() => {
                            isRejectedByTimeout = true;
                            reject(new Error(`Test timeout exceeded ${timeout}ms`));
                        }, timeout);
                    })
                );
            }

            await Promise.race(raceQueue);

            // noinspection JSUnusedAssignment
            clearTimeout(timer);

            await this.callHook(TestRunControllerPlugins.afterTest, queuedTest, null, this.getWorkerMeta(worker));
        } catch (error) {
            if (isRejectedByTimeout) {
                await worker.kill('SIGABRT');
            }

            queuedTest.retryErrors.push(error);
            // noinspection JSUnusedAssignment
            clearTimeout(timer);

            await this.onTestFailed(error, worker, queuedTest, queue);
        }
    }
}
