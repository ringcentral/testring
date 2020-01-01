import { loggerClient } from '@testring/logger';
import { TestContext } from './test-context';
import { testAPIController } from './test-api-controller';

type TestFunction = (api: TestContext) => void | Promise<any>;

function getValidCopyVmError(error) {
    if (error instanceof Error) {
        return error;
    }

    // TODO (flops) check signature
    let tmpError = new Error(error.message);
    tmpError.stack = error.stack;
    return tmpError;
}

export function beforeRun(callback) {
    testAPIController.registerBeforeRunCallback(callback);
}


export function afterRun(callback) {
    testAPIController.registerAfterRunCallback(callback);
}


export async function run(...tests: Array<TestFunction>) {
    const testID = testAPIController.getTestID();
    const bus = testAPIController.getBus();
    const testParameters = testAPIController.getTestParameters() as any;

    const api = new TestContext(testParameters.runData);
    let passed = false;
    let catchedError;

    afterRun(async () => {
        try {
            await api.end();
        } catch (err) {
            loggerClient.error(err);
        }
    });

    try {
        await bus.startedTest();

        await testAPIController.flushBeforeRunCallbacks();

        loggerClient.startStep(testID);

        for (let test of tests) {
            await test.call(api, api);
        }

        passed = true;
    } catch (error) {
        catchedError = getValidCopyVmError(error);
    } finally {
        if (passed) {
            loggerClient.endStep(testID, 'Test passed');

            await bus.finishedTest();
        } else {
            loggerClient.endStep(testID, 'Test failed', catchedError);

            await bus.failedTest(catchedError);
        }
    }
}
