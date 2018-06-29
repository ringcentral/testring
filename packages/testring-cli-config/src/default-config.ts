import { IConfig } from '@testring/types';
import { LogLevel } from '@testring/logger';

export const defaultConfiguration: IConfig = {
    report: './.testring_reports',
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
