import { LogLevel } from '../logger/enums';
import { IFile } from '../fs-reader';
import { IRecorderRuntimeConfiguration } from '../recorder-backend';

export const enum TestRunControllerPlugins {
    beforeRun = 'beforeRun',
    beforeTest = 'beforeTest',
    afterTest = 'afterTest',
    beforeTestRetry = 'beforeTestRetry',
    afterRun = 'afterRun',
    shouldNotExecute = 'shouldNotExecute',
    shouldNotStart = 'shouldNotStart',
    shouldNotRetry = 'shouldNotRetry',
}

export interface ITestQueuedTestRunData {
    debug: boolean;
    logLevel: LogLevel;
    httpThrottle: number;
    screenshotsEnabled: boolean;
    isRetryRun: boolean;
    devtool: IRecorderRuntimeConfiguration | null;
}

export interface IQueuedTest {
    retryCount: number;
    retryErrors: Array<any>;
    test: IFile;
    parameters: any;
    envParameters: any;
}

export interface ITestRunController {
    runQueue(testSet: Array<IFile>): Promise<Error[] | null>;

    kill(): Promise<void>;
}
