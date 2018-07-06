import { WebApplication } from '@testring/web-application';
import { TestEvents } from '@testring/types';
import { TestContext } from './test-context';
import { testAPIController, TestAPIController } from './test-api-controller';

type TestFunction = (context: TestContext) => void | Promise<any>;

const run = async (...tests: Array<TestFunction>) => {
    const bus = testAPIController.getBus();

    bus.emit(TestEvents.started);

    try {
        for (let test of tests) {
            const context = new TestContext();

            let caughtError;

            try {
                await test.call(context, context);
            } catch (error) {
                caughtError = error;
            } finally {
                await context.application.end();
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

export { run, testAPIController, TestAPIController, WebApplication };
