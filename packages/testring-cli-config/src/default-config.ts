import { IConfig, LogLevel } from '@testring/types';

export const defaultConfiguration: Partial<IConfig> = {
    config: '.testring',
    debug: false,
    silent: false,
    bail: false,
    workerLimit: 10,
    retryCount: 3,
    retryDelay: 2000,
    httpThrottle: 0,
    logLevel: LogLevel.info
};
