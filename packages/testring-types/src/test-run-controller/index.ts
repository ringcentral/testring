import { ITestFile } from '../test-finder';

export const enum TestRunControllerHooks {
    beforeRun = 'beforeRun',
    beforeTest = 'beforeTest',
    afterTest = 'afterTest',
    afterRun = 'afterRun',
}

export interface IQueuedTest {
    retryCount: number,
    retryErrors: Array<any>,
    test: ITestFile
}

export interface ITestRunController {
    runQueue(testSet: Array<ITestFile>): Promise<Error[] | void>;
}
