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

export const run = async (...tests: Array<TestFunction>) => {
    const testID = testAPIController.getTestID();
    const bus = testAPIController.getBus();

    const api = new TestContext();

    try {
        bus.emit(TestEvents.started);

        loggerClient.startStep(testID);
        loggerClient.debug('Memory usage before run:', getMemoryUsage());

        for (let test of tests) {
            await test.call(api, api);
        }

        loggerClient.debug('Memory usage after run:', getMemoryUsage());
        loggerClient.endStep(testID, 'Test passed');

        bus.emit(TestEvents.finished);
    } catch (error) {
        loggerClient.debug('Memory usage after run:', getMemoryUsage());
        loggerClient.endStep(testID, 'Test failed', error);

        bus.emit(TestEvents.failed, error);
    } finally {
        await api.end();
    }
};
