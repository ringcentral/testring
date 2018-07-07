import { TestRunControllerHooks, IQueuedTest } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestRunControllerAPI extends AbstractAPI {

    beforeRun(handler: (queue: Array<IQueuedTest>) => Promise<IQueuedTest[]>) {
        this.registryWritePlugin(TestRunControllerHooks.beforeRun, handler);
    }

    beforeTest(handler: (test: IQueuedTest) => Promise<void>) {
        this.registryWritePlugin(TestRunControllerHooks.beforeTest, handler);
    }

    afterTest(handler: (params: IQueuedTest) => Promise<void>) {
        this.registryWritePlugin(TestRunControllerHooks.afterTest, handler);
    }

    afterRun(handler: (queue: Array<IQueuedTest>) => Promise<void>) {
        this.registryWritePlugin(TestRunControllerHooks.afterRun, handler);
    }
}
