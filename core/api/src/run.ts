import {loggerClient} from '@testring/logger';
import {restructureError} from '@testring/utils';

import {TestContext} from './test-context';
import {testAPIController} from './test-api-controller';

type TestFunction = (api: TestContext) => void | Promise<any>;

export function beforeRun(callback: (...args: any[]) => any) {
    testAPIController.registerBeforeRunCallback(callback);
}

export function afterRun(callback: (...args: any[]) => any) {
    testAPIController.registerAfterRunCallback(callback);
}

export async function run(...tests: Array<TestFunction>) {
    const testID = testAPIController.getTestID();
    const bus = testAPIController.getBus();
    const testParameters = testAPIController.getTestParameters() as any;

    const api = new TestContext(testParameters.runData);
    let passed = false;
    let catchedError: Error | null = null;

    try {
        await bus.startedTest();

        await testAPIController.flushBeforeRunCallbacks();

        loggerClient.startStep(testID);

        for (const test of tests) {
            await test.call(api, api);
        }

        passed = true;
    } catch (error) {
        catchedError = restructureError(error as Error);
    } finally {
        try {
            await api.end();
        } catch (error) {
            const cleanupError = restructureError(error as Error);
            if (!catchedError) {
                catchedError = cleanupError;
                passed = false;
            } else {
                Object.assign(catchedError, {
                    cleanupErrors: (cleanupError as any).cleanupErrors || [
                        cleanupError,
                    ],
                });
            }
        }

        if (passed && !catchedError) {
            loggerClient.endStep(testID, 'Test passed');

            await bus.finishedTest();
        } else {
            loggerClient.endStep(testID, 'Test failed', catchedError);

            await bus.failedTest(catchedError as Error);
        }
    }
}
