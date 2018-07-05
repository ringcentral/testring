import { WebApplication } from '@testring/web-application';
import { TestEvents } from '@testring/types';
import { TestContext } from './test-context';
import { testAPIController } from './test-api-controller';


const run = async (...tests: Array<Function>) => {

    testAPIController.getBus().emit(TestEvents.started);

    try {
        for (let test of tests) {
            const context = new TestContext();

            let caughtedError;

            try {
                await test.call(context, context);
            } catch (error) {
                caughtedError = error;
            } finally {
                await context.application.end();
            }

            if (caughtedError) {
                throw caughtedError;
            }
        }

        testAPIController.getBus().emit(TestEvents.finished);
    } catch (e) {
        testAPIController.getBus().emit(TestEvents.failed);
    }
};

export { run, testAPIController, WebApplication };
