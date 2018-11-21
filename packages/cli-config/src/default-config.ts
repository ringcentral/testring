import {
    IConfig,
    LogLevel,
} from '@testring/types';

export const defaultConfiguration: Partial<IConfig> = {
    restartWorker: 'never',
    screenshots: 'disable',
    config: '.testringrc',
    debug: false,
    localWorker: false,
    silent: false,
    bail: false,
    workerLimit: 10,
    retryCount: 3,
    retryDelay: 2000,
    testTimeout: 15 * 60 * 1000,
    logLevel: LogLevel.info,
    envParameters: {},
    httpThrottle: 0,
};
