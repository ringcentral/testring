import { IConfig, ITestWorker, ITestWorkerInstance, ITestFile } from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClientLocal } from '@testring/logger';

export interface IQueuedTest {
    retryCount: number,
    test: ITestFile
}

const delay = (milliseconds: number) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
});

export enum TestRunControllerHooks {
    beforeRun = 'beforeRun',
}

export class TestRunController extends PluggableModule {

    private errors: Array<Error> = [];

    constructor(
        private config: Partial<IConfig>,
        private testWorker: ITestWorker,
    ) {
        super([
            TestRunControllerHooks.beforeRun,
        ]);
    }

    public async runQueue(testSet: Array<ITestFile>): Promise<Error[] | void> {
        const testQueue = this.prepareTests(testSet);
        const testQueueAfterHook = await this.callHook(TestRunControllerHooks.beforeRun, testQueue);
        const configWorkerLimit = this.config.workerLimit || 0;

        const workerLimit = configWorkerLimit < testQueueAfterHook.length ?
            configWorkerLimit :
            testQueueAfterHook.length;

        const workers = this.createWorkers(workerLimit);

        try {
            await Promise.all(
                workers.map(worker => this.executeWorker(worker, testQueueAfterHook))
            );
        } catch (e) {
            loggerClientLocal.error(...this.errors);
            throw e;
        }

        if (this.errors.length) {
            return this.errors;
        }
    }

    private createWorkers(limit: number): Array<ITestWorkerInstance> {
        const workers: Array<ITestWorkerInstance> = [];

        for (let index = 0; index < limit; index++) {
            workers.push(this.testWorker.spawn());
        }

        return workers;
    }

    private prepareTests(testFiles: Array<ITestFile>): Array<IQueuedTest> {
        const testQueue = new Array(testFiles.length);
        const retryCount = this.config.retryCount || 0;

        for (let index = 0; index < testFiles.length; index++) {
            testQueue[index] = {
                retryCount: retryCount,
                test: testFiles[index]
            };
        }

        return testQueue;
    }

    private async occupyWorker(worker: ITestWorkerInstance, queue: Array<IQueuedTest>): Promise<void> {
        if (queue.length > 0) {
            return this.executeWorker(worker, queue);
        } else {
            worker.kill();
        }
    }

    private async onTestFailed(
        exception: any,
        worker: ITestWorkerInstance,
        test: IQueuedTest,
        queue: Array<IQueuedTest>
    ): Promise<void> {
        if (this.config.bail) {
            this.errors.push(exception.error);
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

    private async executeWorker(worker: ITestWorkerInstance, queue: Array<IQueuedTest>): Promise<void> {
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
