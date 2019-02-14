import {
    IConfig,
    LogLevel,
} from '@testring/types';

export const defaultConfiguration: IConfig = {
    recorder: false,
    tests: './tests/**/*.js',
    restartWorker: 'never',
    screenshots: 'disable',
    config: '.testringrc',
    debug: false,
    silent: false,
    bail: false,
    workerLimit: 1,
    plugins: [],
    retryCount: 3,
    retryDelay: 2000,
    testTimeout: 15 * 60 * 1000,
    logLevel: LogLevel.info,
    envParameters: {},
    httpThrottle: 0,
};
