import * as yargs from 'yargs';
import { IConfig } from '@testring/types';

const pkg = require('../package.json');

const RESTRICTED_FIELDS = ['_', '$0', 'version', 'help'];

const createField = (key: keyof IConfig, options: yargs.Options) => {
    yargs.option(key, options);
};

yargs.version(pkg.version);

createField('debug', {
    describe: 'Debugging flag',
    type: 'boolean'
});

createField('bail', {
    describe: 'Shut down app after test fail',
    type: 'boolean'
});

createField('workerLimit', {
    describe: 'Maximum amount of parallel child_process',
    type: 'number'
});

createField('retryCount', {
    describe: 'Number of retry attempts',
    type: 'number'
});

createField('retryDelay', {
    describe: 'Time of delay before retry',
    type: 'number'
});

createField('config', {
    describe: 'Custom path to config file',
    type: 'string'
});

createField('tests', {
    describe: 'Search path for test files (glob pattern)',
    type: 'string'
});

createField('plugins', {
    describe: 'Set of plugins (list). API: --plugins=plugin1 --plugins=plugin2 ...',
    type: 'array'
});

createField('httpThrottle', {
    describe: 'Time of delay before next http request',
    type: 'number'
});

createField('logLevel', {
    describe: 'Flag for filtering log records',
    type: 'string'
});

createField('envConfig', {
    describe: 'Path to environment config which overrides main config',
    type: 'string'
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
