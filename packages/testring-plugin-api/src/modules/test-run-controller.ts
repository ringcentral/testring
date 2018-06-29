import { TestRunControllerHooks, IQueuedTest } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestRunControllerAPI extends AbstractAPI {

    beforeRun(handler: (queue: Array<IQueuedTest>) => Array<IQueuedTest>) {
        this.registrySyncPlugin(TestRunControllerHooks.beforeRun, handler);
    }
}
