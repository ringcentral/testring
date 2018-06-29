import { ITestFile } from '../test-finder';

export enum TestRunControllerHooks {
    prepareQueue = 'prepareQueue',
    prepareParams = 'prepareParams',
    afterFinish = 'afterFinish',
}

export interface IQueuedTest {
    retryCount: number,
    test: ITestFile
}

export interface ITestRunController {
    runQueue(testSet: Array<ITestFile>): Promise<Error[] | void>;
}
