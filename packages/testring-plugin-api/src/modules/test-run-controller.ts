import { TestRunControllerHooks, IQueuedTest } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestRunControllerAPI extends AbstractAPI {

    prepareQueue(handler: (queue: Array<IQueuedTest>) => Promise<IQueuedTest[]>) {
        this.registryAsyncPlugin(TestRunControllerHooks.prepareQueue, handler);
    }

    prepareParams(handler: (params: object) => Promise<object>) {
        this.registryAsyncPlugin(TestRunControllerHooks.prepareParams, handler);
    }

    afterFinish(handler: (params: object) => Promise<void>) {
        this.registryAsyncPlugin(TestRunControllerHooks.afterFinish, handler);
    }
}
