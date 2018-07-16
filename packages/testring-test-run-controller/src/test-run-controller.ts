import {
    IConfig,
    ITestWorker,
    ITestWorkerInstance,
    ITestFile,
    IQueuedTest,
    ITestRunController,
    TestRunControllerPlugins
} from '@testring/types';
import { loggerClientLocal } from '@testring/logger';
import { PluggableModule } from '@testring/pluggable-module';
import { Queue } from '@testring/utils';

type TestQueue = Queue<IQueuedTest>;

const delay = (milliseconds: number) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
});

export class TestRunController extends PluggableModule implements ITestRunController {

    private errors: Array<Error> = [];
    private currentQueue: TestQueue | null = null;
    private currentRun: Promise<any> | null = null;

    constructor(
        private config: Partial<IConfig>,
        private testWorker: ITestWorker
    ) {
        super([
            TestRunControllerPlugins.beforeRun,
            TestRunControllerPlugins.beforeTest,
            TestRunControllerPlugins.afterTest,
            TestRunControllerPlugins.afterRun,
            TestRunControllerPlugins.shouldRetry
        ]);
    }

    public async pushTestIntoQueue(testString: string) {
        const testQueueItem = this.prepareTest({
            path: '',
            content: testString,
            meta: {}
        });
        if (Array.isArray(this.currentQueue)) {
            this.currentQueue.push(testQueueItem);
        } else {
            this.currentQueue = new Queue([testQueueItem]);
            this.currentRun = this.executeQueue(this.currentQueue);
        }

        return this.currentRun;
    }

    public async runQueue(testSet: Array<ITestFile>): Promise<Error[] | null> {
        const testQueue = await this.prepareTests(testSet);

        loggerClientLocal.debug('Run controller: tests queue created.');

        if (Array.isArray(this.currentQueue)) {
            this.currentQueue.push(...testQueue);
        } else {
            this.currentQueue = testQueue;
            this.currentRun = this.executeQueue(this.currentQueue);
        }

        return this.currentRun;
    }

    private async executeQueue(testQueue: TestQueue): Promise<Error[] | null> {
        const workerLimit = this.getWorkerLimit(testQueue);
        const workers = this.createWorkers(workerLimit);

        loggerClientLocal.debug(`Run controller: ${workerLimit} worker(s) created.`);

        try {
            await Promise.all(
                workers.map(worker => this.executeWorker(worker, testQueue))
            );

            await this.callHook(TestRunControllerPlugins.afterRun, testQueue);
        } catch (error) {
            this.errors.push(error);
        }

        this.currentQueue = null;

        if (this.errors.length) {
            return this.errors;
        }

        return null;
    }

    private getWorkerLimit(testQueue: TestQueue) {
        const configWorkerLimit = this.config.workerLimit || 0;

        if (configWorkerLimit < testQueue.length) {
            return configWorkerLimit;
        }

        return testQueue.length;
    }

    private createWorkers(limit: number): Array<ITestWorkerInstance> {
        const workers: Array<ITestWorkerInstance> = [];

        for (let index = 0; index < limit; index++) {
            workers.push(this.testWorker.spawn());
        }

        return workers;
    }

    private prepareTest(testFile: ITestFile) {
        return {
            retryCount: 0,
            retryErrors: [],
            test: testFile
        };
    }

    private async prepareTests(testFiles: Array<ITestFile>): Promise<TestQueue> {
        const testQueue = new Array(testFiles.length);

        for (let index = 0; index < testFiles.length; index++) {
            testQueue[index] = this.prepareTest(testFiles[index]);
        }

        const modifierQueue = await this.callHook(TestRunControllerPlugins.beforeRun, testQueue);

        return new Queue(modifierQueue);
    }

    private async occupyWorker(worker: ITestWorkerInstance, queue: TestQueue): Promise<void> {
        if (queue.length > 0) {
            return this.executeWorker(worker, queue);
        } else {
            worker.kill();
        }
    }

    private async onTestFailed(
        error: Error,
        worker: ITestWorkerInstance,
        queueItem: IQueuedTest,
        queue: TestQueue
    ): Promise<void> {
        if (this.config.bail) {
            throw error;
        }

        const shouldRetry = await this.callHook(TestRunControllerPlugins.shouldRetry, queueItem.test.path);

        if (
            !!shouldRetry &&
            queueItem.retryCount < (this.config.retryCount || 0)
        ) {
            queueItem.retryCount++;

            await delay(this.config.retryDelay || 0);

            queue.push(queueItem);

            await this.executeWorker(worker, queue);
        } else {
            this.errors.push(error);

            await this.callHook(TestRunControllerPlugins.afterTest, queueItem);
            await this.occupyWorker(worker, queue);
        }
    }

    private async executeWorker(worker: ITestWorkerInstance, queue: TestQueue): Promise<void> {
        const queuedTest = queue.shift();

        if (!queuedTest) {
            return;
        }

        try {
            await this.callHook(TestRunControllerPlugins.beforeTest, queuedTest);

            await worker.execute(queuedTest.test.content, queuedTest.test.path, queuedTest.test.meta);

            await this.callHook(TestRunControllerPlugins.afterTest, queuedTest);
        } catch (error) {
            queuedTest.retryErrors.push(error);

            await this.onTestFailed(error, worker, queuedTest, queue);
        } finally {
            await this.occupyWorker(worker, queue);
        }
    }
}
