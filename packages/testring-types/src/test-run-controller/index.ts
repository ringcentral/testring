import { ITestFile } from '../test-finder';

export const enum TestRunControllerPlugins {
    beforeRun = 'beforeRun',
    beforeTest = 'beforeTest',
    afterTest = 'afterTest',
    afterRun = 'afterRun',
    shouldRetry = 'shouldRetry',
}

export interface IQueuedTest {
    retryCount: number;
    retryErrors: Array<any>;
    test?: ITestFile;
    testString?: string;
}

export interface ITestRunController {
    runQueue(testSet: Array<ITestFile>): Promise<Error[] | null>;
}
