import {TestRunControllerPlugins, IQueuedTest, ITestWorkerCallbackMeta} from '@testring/types';
import {AbstractAPI} from './abstract';

export class TestRunControllerAPI extends AbstractAPI {
    beforeRun(handler: (queue: IQueuedTest[]) => Promise<IQueuedTest[]>) {
        this.registryWritePlugin(TestRunControllerPlugins.beforeRun, handler);
    }

    beforeTest(handler: (test: IQueuedTest, meta: ITestWorkerCallbackMeta) => Promise<IQueuedTest>) {
        this.registryWritePlugin(TestRunControllerPlugins.beforeTest, handler);
    }

    beforeTestRetry(handler: (params: IQueuedTest, error: Error, meta: ITestWorkerCallbackMeta) => Promise<IQueuedTest>) {
        this.registryWritePlugin(
            TestRunControllerPlugins.beforeTestRetry,
            handler,
        );
    }

    afterTest(handler: (params: IQueuedTest, error: Error | null, meta: ITestWorkerCallbackMeta) => Promise<IQueuedTest>) {
        this.registryWritePlugin(TestRunControllerPlugins.afterTest, handler);
    }

    afterRun(handler: (error: Error | null) => Promise<void>) {
        this.registryWritePlugin(TestRunControllerPlugins.afterRun, handler);
    }

    shouldNotExecute(
        handler: (state: boolean, queue: IQueuedTest[]) => Promise<boolean>,
    ) {
        this.registryWritePlugin(
            TestRunControllerPlugins.shouldNotExecute,
            handler,
        );
    }

    shouldNotStart(
        handler: (state: boolean, test: IQueuedTest, meta: ITestWorkerCallbackMeta) => Promise<boolean>,
    ) {
        this.registryWritePlugin(
            TestRunControllerPlugins.shouldNotStart,
            handler,
        );
    }

    shouldNotRetry(
        handler: (state: boolean, test: IQueuedTest, meta: ITestWorkerCallbackMeta) => Promise<boolean>,
    ) {
        this.registryWritePlugin(
            TestRunControllerPlugins.shouldNotRetry,
            handler,
        );
    }
}
