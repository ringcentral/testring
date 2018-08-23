import * as bytes from 'bytes';
import { loggerClient } from '@testring/logger';
import { TestEvents } from '@testring/types';
import { TestContext } from './test-context';
import { testAPIController } from './test-api-controller';

type TestFunction = (api: TestContext) => void | Promise<any>;

const getMemoryUsage = () => {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.heapUsed);
};

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

    const api = new TestContext();
    let passed = false;
    let catchedError;

    try {
        bus.emit(TestEvents.started);

        loggerClient.startStep(testID);
        loggerClient.debug('Memory usage before run:', getMemoryUsage());

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

        loggerClient.debug('Memory usage after run:', getMemoryUsage());

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
