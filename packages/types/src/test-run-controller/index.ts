import { IFile } from '../fs-reader';

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
    test: IFile;
    parameters: any;
}

export interface ITestRunController {
    runQueue(testSet: Array<IFile>): Promise<Error[] | null>;

    kill(): Promise<void>;
}
