import * as yargs from 'yargs';
import { IConfig } from '@testring/typings';

const pkg = require('../package.json');

const RESTRICTED_FIELDS = ['_', '$0', 'version', 'help'];

const createField = (key: keyof IConfig, options: yargs.Options) => {
    yargs.option(key, options);
};

yargs.version(pkg.version);

createField('debug', {
    describe: 'specify test data section',
    type: 'boolean',
    default: undefined
});

createField('verbose', {
    describe: 'shut down app after test fail',
    type: 'boolean',
    default: undefined
});

createField('workerLimit', {
    describe: 'maximum amount of parallels child_process',
    type: 'number'
});

createField('retryCount', {
    describe: 'number of retry attempts',
    type: 'number'
});

createField('retryDelay', {
    describe: 'time of delay before retry',
    type: 'number'
});

createField('config', {
    describe: 'custom path to config file',
    type: 'string'
});

createField('report', {
    describe: 'report directory (logs, screenshots)',
    type: 'string'
});

createField('tests', {
    describe: 'search path for test files (supports glob)',
    type: 'string'
});

createField('plugins', {
    describe: 'set of plugins (list). API: --plugins=plugin1 --plugins=plugin2 ...',
    type: 'array'
});

createField('httpThrottle', {
    describe: 'time of delay before next http request',
    type: 'number'
});

createField('loggerLevel', {
    describe: 'flag for filtering log records',
    type: 'number'
});

const normalize = (args: yargs.Arguments): IConfig => {
    const normalizedArgs = {};

    let arg;

    for (let key in args) {
        if (RESTRICTED_FIELDS.includes(key)) {
            continue;
        }

        arg = args[key];

        if (arg === undefined) {
            continue;
        }

        normalizedArgs[key] = arg;
    }

    return normalizedArgs as IConfig;
};

export const getArguments = (argv: Array<string>): IConfig | null => {
    if (!argv) {
        return null;
    }

    const args = yargs.parse(argv);

    return normalize(args);
};
