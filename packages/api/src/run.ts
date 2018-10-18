import { loggerClient } from '@testring/logger';
import { TestEvents } from '@testring/types';
import { getMemoryReport } from '@testring/utils';
import { TestContext } from './test-context';
import { testAPIController } from './test-api-controller';

type TestFunction = (api: TestContext) => void | Promise<any>;

const getValidCopyVmError = (error) => {
    if (error instanceof Error) {
        return error;
    }

    // TODO check signature
    let tmpError = new Error(error.message);
    tmpError.stack = error.stack;
    return tmpError;
};

export const run = async (...tests: Array<TestFunction>) => {
    const testID = testAPIController.getTestID();
    const bus = testAPIController.getBus();
    const testParameters = testAPIController.getTestParameters() as any;

    const api = new TestContext(testParameters.runData.httpThrottle);
    let passed = false;
    let catchedError;

    try {
        bus.emit(TestEvents.started);

        loggerClient.startStep(testID);
        loggerClient.debug('Worker process memory usage before run.', getMemoryReport());

        for (let test of tests) {
            await test.call(api, api);
        }

        passed = true;
    } catch (error) {
        catchedError = getValidCopyVmError(error);
    } finally {
        let exitError;
        try {
            await api.end();
        } catch (error) {
            exitError = error;
        }

        loggerClient.debug('Worker process memory usage after run.', getMemoryReport());

        if (passed) {
            loggerClient.endStep(testID, 'Test passed');

            bus.emit(TestEvents.finished);
        } else {
            loggerClient.endStep(testID, 'Test failed', catchedError);

            bus.emit(TestEvents.failed, catchedError);
        }

        if (exitError) {
            loggerClient.error(exitError);
        }
    }
};
