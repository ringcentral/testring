import * as yargs from 'yargs';
import { IConfig } from '@testring/types';

const pkg = require('../package.json');

const RESTRICTED_FIELDS = ['_', '$0', 'version', 'help'];

yargs.version(pkg.version);

const yargsOptions = {
    'debug': {
        describe: 'specify test data section',
        type: 'boolean'
    },
    'bail': {
        describe: 'shut down app after test fail',
        type: 'boolean'
    },
    'workerLimit': {
        describe: 'maximum amount of parallels child_process',
        type: 'number'
    },
    'retryCount': {
        describe: 'number of retry attempts',
        type: 'number'
    },
    'retryDelay': {
        describe: 'time of delay before retry',
        type: 'number'
    },
    'config': {
        describe: 'custom path to config file',
        type: 'string'
    },
    'tests': {
        describe: 'search path for test files (supports glob)',
        type: 'string'
    },
    'plugins': {
        describe: 'set of plugins (list). API: --plugins=plugin1 --plugins=plugin2 ...',
        type: 'array'
    },
    'httpThrottle': {
        describe: 'time of delay before next http request',
        type: 'number'
    },
    'logLevel': {
        describe: 'flag for filtering log records',
        type: 'string'
    },
    'envConfig': {
        describe: 'path to environment config which overrides main config',
        type: 'string',
    }
};

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

    const cmdRun = {
        command: 'run',
        desc: 'To run tests',
        builder: (yargs) => {
            for (let key in yargsOptions) {
                yargs.option(key, yargsOptions[key]);
            }
            return yargs;
        },
        handler: (argv) => {
            argv.command = 'run';

        }
    };

    const cmdRecord = {
        command: 'record',
        desc: 'To make a record',
        builder: (yargs) => {
            for (let key in yargsOptions) {
                yargs.option(key, yargsOptions[key]);
            }
            return yargs;
        },
        handler: (argv) => {
            argv.command = 'record';
        }
    };

    const args = yargs.usage('$0 command')
        .command(cmdRun)
        .command(cmdRecord)
        .demandCommand(1, 'Please provide a valid command\n')
        .help().argv;

    return normalize(args);
};
