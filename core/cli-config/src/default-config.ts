import {IConfig, LogLevel} from '@testring/types';

export const defaultConfiguration: IConfig = {
    devtool: false,
    tests: './tests/**/*.js',
    restartWorker: false,
    screenshots: 'disable',
    screenshotPath: './_tmp/',
    config: '.testringrc',
    debug: false,
    silent: false,
    bail: false,
    workerLimit: 1,
    maxWriteThreadCount: 2,
    plugins: [],
    retryCount: 3,
    retryDelay: 2000,
    testTimeout: 15 * 60 * 1000,
    logLevel: LogLevel.info,
    envParameters: {},
    httpThrottle: 0,
};
