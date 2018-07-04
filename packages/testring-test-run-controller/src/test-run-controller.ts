import {
    IConfig,
    ITestWorker,
    ITestWorkerInstance,
    ITestFile,
    IQueuedTest,
    ITestRunController,
    ITestExecutionError,
    TestRunControllerHooks
} from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClientLocal } from '@testring/logger';

type TestQueue = Array<IQueuedTest>;

const delay = (milliseconds: number) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
});

export class TestRunController extends PluggableModule implements ITestRunController {

    private errors: Array<Error> = [];

    constructor(
        private config: Partial<IConfig>,
        private testWorker: ITestWorker
    ) {
        super([
            TestRunControllerHooks.beforeRun
        ]);
    }

    public async runQueue(testSet: Array<ITestFile>): Promise<Error[] | void> {
        const testQueue = await this.prepareTests(testSet);

        loggerClientLocal.debug('Run controller: tests queue created.');

        const workerLimit = this.getWorkerLimit(testQueue);
        const workers = this.createWorkers(workerLimit);

        loggerClientLocal.debug(`Run controller: ${workerLimit} worker(s) created.`);

        try {
            await Promise.all(
                workers.map(worker => this.executeWorker(worker, testQueue))
            );
        } catch (error) {
            loggerClientLocal.error(...this.errors);

            this.errors.push(error);
        }

        if (this.errors.length) {
            return this.errors;
        }
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

    private async prepareTests(testFiles: Array<ITestFile>): Promise<TestQueue> {
        const testQueue = new Array(testFiles.length);
        const retryCount = this.config.retryCount || 0;

        for (let index = 0; index < testFiles.length; index++) {
            testQueue[index] = {
                retryCount: retryCount,
                test: testFiles[index]
            };
        }

        return await this.callHook(TestRunControllerHooks.beforeRun, testQueue);
    }

    private async occupyWorker(worker: ITestWorkerInstance, queue: TestQueue): Promise<void> {
        if (queue.length > 0) {
            return this.executeWorker(worker, queue);
        } else {
            worker.kill();
        }
    }

    private async onTestFailed(
        exception: ITestExecutionError,
        worker: ITestWorkerInstance,
        test: IQueuedTest,
        queue: TestQueue
    ): Promise<void> {
        if (this.config.bail) {
            throw exception.error;
        }

        if (test.retryCount > 0) {
            test.retryCount--;

            await delay(this.config.retryDelay || 0);

            queue.push(test);

            await this.executeWorker(worker, queue);
        } else {
            this.errors.push(exception.error);

            await this.occupyWorker(worker, queue);
        }
    }

    private async executeWorker(worker: ITestWorkerInstance, queue: TestQueue): Promise<void> {
        const queuedTest = queue.pop();

        if (!queuedTest) {
            return;
        }

        try {
            await worker.execute(queuedTest.test.content, queuedTest.test.path, queuedTest.test.meta);
        } catch (error) {
            await this.onTestFailed(error, worker, queuedTest, queue);
        } finally {
            await this.occupyWorker(worker, queue);
        }
    }
}
