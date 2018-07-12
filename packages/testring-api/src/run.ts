import { loggerClient } from '@testring/logger';
import { TestEvents } from '@testring/types';
import { TestContext } from './test-context';
import { testAPIController } from './test-api-controller';

type TestFunction = (api: TestContext) => void | Promise<any>;

export const run = async (...tests: Array<TestFunction>) => {
    const testID = testAPIController.getTestID();
    const bus = testAPIController.getBus();

    bus.emit(TestEvents.started);

    try {
        for (let test of tests) {
            const api = new TestContext();

            let caughtError;

            try {
                loggerClient.startStep(testID);

                await test.call(api, api);
            } catch (error) {
                caughtError = error;
            } finally {
                if (caughtError) {
                    loggerClient.endStep(testID, 'Test failed', caughtError);
                } else {
                    loggerClient.endStep(testID, 'Test passed');
                }

                await api.end();
            }

            if (caughtError) {
                throw caughtError;
            }
        }

        bus.emit(TestEvents.finished);
    } catch (error) {
        bus.emit(TestEvents.failed, error);
    }
};
