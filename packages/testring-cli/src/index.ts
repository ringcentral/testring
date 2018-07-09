import * as process from 'process';
import * as yargs from 'yargs';
import { loggerClientLocal } from '@testring/logger';
import { runTests } from './commands/run';

const pkg = require('../package.json');

yargs.usage('$0 command')
    .command('run', 'To run tests')
    .command('record', 'To make a record')
    .demandCommand(1, 'Please provide a valid command\n')
    .version(pkg.version)
    .help();

export const runCLI = (argv: Array<string>) => {
    const args = yargs.parse(argv);
    const command = args._[2];

    let commandExecution;

    switch (command) {
        case 'run':
            commandExecution = runTests(argv, process.stdout);
            break;

        case 'record':
            throw new Error('Record not implemented yet.');

        default:
            yargs.showHelp();
            return;
    }

    commandExecution.catch((exception) => {
        loggerClientLocal.error(exception);
        process.exit(1);
    });
};
