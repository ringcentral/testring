import { TestRunControllerHooks, IQueuedTest } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestRunControllerAPI extends AbstractAPI {

    beforeRun(handler: (queue: Array<IQueuedTest>) => Promise<IQueuedTest[]>) {
        this.registryAsyncPlugin(TestRunControllerHooks.beforeRun, handler);
    }

    beforeTest(handler: (test: IQueuedTest) => Promise<void>) {
        this.registryAsyncPlugin(TestRunControllerHooks.beforeTest, handler);
    }

    afterTest(handler: (params: IQueuedTest) => Promise<void>) {
        this.registryAsyncPlugin(TestRunControllerHooks.afterTest, handler);
    }

    afterRun(handler: (queue: Array<IQueuedTest>) => Promise<void>) {
        this.registryAsyncPlugin(TestRunControllerHooks.afterRun, handler);
    }
}
