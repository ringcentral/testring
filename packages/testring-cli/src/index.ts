import * as process from 'process';
import * as yargs from 'yargs';
import { loggerClientLocal } from '@testring/logger';
import { IConfig } from '@testring/types';
import { runTests } from './commands/run';
import { runRecordingProcess } from './commands/record';

const pkg = require('../package.json');

const createField = (key: keyof IConfig, options: yargs.Options) => {
    yargs.option(key.toString(), options);
};

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

yargs.usage('$0 command')
    .version(`testring version: ${pkg.version}`)
    .command('run', 'To run tests')
    .command('record', 'To make a record')
    .demandCommand(1, 'Please provide a valid command\n')
    .help();

// CLI entry point, it makes all initialization job and
// handles all errors, that was not cached inside command

export const runCLI = (argv: Array<string>) => {
    const args = yargs.parse(argv);
    const command = args._[2];

    let commandExecution;

    switch (command) {
        case 'run':
            commandExecution = runTests(argv, process.stdout);
            break;

        case 'record':
            commandExecution = runRecordingProcess(argv, process.stdout);
            break;

        default:
            yargs.showHelp();
            return;
    }

    commandExecution.catch((exception) => {
        loggerClientLocal.error(exception);
        process.exit(1);
    });

};
