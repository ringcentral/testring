import {
    IConfig,
    LogLevel,
} from '@testring/types';

export const defaultConfiguration: Partial<IConfig> = {
    restartWorker: 'never',
    screenshots: 'disabled',
    config: '.testringrc',
    debug: false,
    silent: false,
    bail: false,
    workerLimit: 10,
    retryCount: 3,
    retryDelay: 2000,
    testTimeout: 15 * 60 * 1000,
    logLevel: LogLevel.info,
    envParameters: {}
};
