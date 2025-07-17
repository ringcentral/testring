import process from 'node:process';
import * as yargs from 'yargs';
import {loggerClient, LoggerServer} from '@testring/logger';
import {getConfig} from '@testring/cli-config';
import {transport} from '@testring/transport';
import {ICLICommand, IConfig} from '@testring/types';
import {runTests} from './commands/runCommand';

const pkg = require('../package.json');

const createField = (key: keyof IConfig, options: yargs.Options) => {
    yargs.option(key.toString(), options);
};

yargs.usage('$0 [command] <arguments>');

yargs.version(`testring version: ${pkg.version}`);

yargs.command('run', 'To run tests');

yargs.help();

createField('bail', {
    describe: 'Shut down app after test fail',
    type: 'boolean',
});

createField('workerLimit', {
    describe: 'Maximum amount of parallel child_process',
    type: 'number',
});

createField('retryCount', {
    describe: 'Number of retry attempts',
    type: 'number',
});

createField('retryDelay', {
    describe: 'Time of delay before retry',
    type: 'number',
});

createField('config', {
    describe: 'Custom path to config file',
    type: 'string',
});

createField('tests', {
    describe: 'Search path for test files (glob pattern)',
    type: 'string',
});

createField('plugins', {
    describe:
        'Set of plugins (list). API: --plugins=plugin1 --plugins=plugin2 ...',
    type: 'array',
});

createField('logLevel', {
    describe: 'Flag for filtering log records',
    type: 'string',
});

createField('envConfig', {
    describe: 'Path to environment config which overrides main config',
    type: 'string',
});

createField('devtool', {
    describe: 'Passed to enable recorder/debug server - deprecated',
    type: 'boolean',
});

// CLI entry point, it makes all initialization job and
// handles all errors, that was not cached inside command

export const runCLI = async (argv: Array<string>): Promise<unknown> => {
    const args = yargs.parseSync(argv);
    const command = args._[2];

    const config = await getConfig(argv);

    let commandExecution: ICLICommand;

    switch (command) {
        case undefined:
        case 'run':
            commandExecution = runTests(config, transport, process.stdout);
            break;

        default:
            yargs.showHelp();
            return Promise.resolve();
    }

    let isExitHandling = false;

    const processExitHandler = async () => {
        if (isExitHandling) {
            return;
        }

        isExitHandling = true;

        process.stdout.write('\nUser caused exit... \n');

        await commandExecution.shutdown();

        process.exit(0);
    };

    //catches ctrl+c event or "kill pid"
    process.on('SIGINT', processExitHandler);
    process.on('SIGUSR1', processExitHandler);
    process.on('SIGUSR2', processExitHandler);
    process.on('SIGHUP', processExitHandler);
    process.on('SIGQUIT', processExitHandler);
    process.on('SIGABRT', processExitHandler);
    process.on('SIGTERM', processExitHandler);

    return commandExecution.execute().catch(async (exception) => {
        if (isExitHandling) {
            return;
        }

        isExitHandling = true;

        new LoggerServer(config, transport, process.stdout);

        loggerClient.error('[CLI] Test execution failed:', exception.message);
        if (exception.stack) {
            loggerClient.error('[CLI] Stack trace:', exception.stack);
        }

        // Log additional error details if available
        if (exception.testFailures && exception.totalTests) {
            loggerClient.error(`[CLI] Test summary: ${exception.testFailures}/${exception.totalTests} tests failed`);
        }

        await commandExecution.shutdown();

        // Use the exit code from the exception if available, otherwise default to 1
        const exitCode = exception.exitCode || exception.code || 1;

        setTimeout(() => {
            loggerClient.error(`[CLI] Exiting with code: ${exitCode}`);
            process.exit(exitCode);
        }, 500);
    });
};
