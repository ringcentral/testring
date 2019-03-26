import { TestRunControllerPlugins, IQueuedTest } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestRunControllerAPI extends AbstractAPI {

    beforeRun(handler: (queue: Array<IQueuedTest>) => Promise<IQueuedTest[]>) {
        this.registryWritePlugin(TestRunControllerPlugins.beforeRun, handler);
    }

    beforeTest(handler: (test: IQueuedTest) => Promise<void>) {
        this.registryWritePlugin(TestRunControllerPlugins.beforeTest, handler);
    }

    beforeTestRetry(handler: (params: IQueuedTest) => Promise<void>) {
        this.registryWritePlugin(TestRunControllerPlugins.beforeTestRetry, handler);
    }

    afterTest(handler: (params: IQueuedTest) => Promise<void>) {
        this.registryWritePlugin(TestRunControllerPlugins.afterTest, handler);
    }

    afterRun(handler: (queue: Array<IQueuedTest>) => Promise<void>) {
        this.registryWritePlugin(TestRunControllerPlugins.afterRun, handler);
    }

    shouldNotRetry(handler: (testPath: string) => Promise<boolean>) {
        this.registryWritePlugin(TestRunControllerPlugins.shouldNotRetry, handler);
    }

    shouldNotStart(handler: (testPath: string) => Promise<boolean>) {
        this.registryWritePlugin(TestRunControllerPlugins.shouldNotStart, handler);
    }
}
