import { IConfig, LogLevel } from '@testring/types';

export const defaultConfiguration: IConfig = {
    config: './testring.json',
    tests: './tests/**/*.js',
    debug: false,
    silent: false,
    bail: false,
    workerLimit: 30,
    retryCount: 3,
    retryDelay: 2000,
    httpThrottle: 0,
    logLevel: LogLevel.info
};
