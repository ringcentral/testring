import { IConfig } from '@testring/typings';

export const defaultConfiguration: IConfig = {
    report: './.testring_reports',
    config: './testring.json',
    tests: './tests/**/*.js',
    debug: false,
    silent: false,
    verbose: false,
    workerLimit: 30,
    retryCount: 3,
    retryDelay: 2000,
    httpThrottle: 0
};
