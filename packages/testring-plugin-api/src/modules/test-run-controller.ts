import { TestRunControllerHooks } from '@testring/test-run-controller';
import { ITestFile } from '@testring/test-finder';

import { AbstractAPI } from './abstract';

export class TestRunControllerAPI extends AbstractAPI {

    beforeRun(handler: (tests: Array<ITestFile>) => Array<ITestFile>) {
        this.registrySyncPlugin(TestRunControllerHooks.beforeRun, handler);
    }
}
