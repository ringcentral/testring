import * as process from 'process';
import { applyPlugins } from '@testring/plugin-api';
import { getConfig } from '@testring/cli-config';
import { LoggerServer, loggerClientLocal } from '@testring/logger';
import { TestsFinder } from '@testring/test-finder';
import { TestWorker } from '@testring/test-worker';
import { TestRunController } from '@testring/test-run-controller';
import { transport } from '@testring/transport';

// CLI entry point, it makes all initialization job and
// handles all errors, that was not cached inside framework

const formatJSON = (obj: any) => {
    const separator = '⋅';
    const padding = 20;

    let str = separator.repeat(padding) + '\n';
    let item;

    for (const key in obj) {
        if (key === 'plugins') {
            item = obj[key].toString().replace('[object Object]', '');
        } else {
            item = JSON.stringify(obj[key]);
        }

        str += `${(key + ' ').padEnd(padding, separator)} ${item}\n`;
    }

    return str + separator.repeat(padding);
};

export const runTests = async (argv: Array<string>, stdout: NodeJS.WritableStream) => {
    const userConfig = await getConfig(argv);

    const loggerServer = new LoggerServer(userConfig, transport, stdout);
    const testFinder = new TestsFinder();
    const testWorker = new TestWorker(transport);
    const testRunController = new TestRunController(userConfig, testWorker);

    applyPlugins({
        logger: loggerServer,
        testFinder: testFinder,
        testWorker: testWorker,
        testRunController: testRunController,
    }, userConfig);

    loggerClientLocal.log('User config:\n', formatJSON(userConfig));

    const tests = await testFinder.find(userConfig.tests);

    loggerClientLocal.info(`Found ${tests.length} test(s) to run.`);

    const testRunResult = await testRunController.runQueue(tests);

    if (testRunResult) {
        throw new Error(`Failed ${testRunResult.length}/${tests.length} tests.`);
    }
};

export const runCLI = (argv: Array<string>) => {
    runTests(argv, process.stdout).catch((exception) => {
        loggerClientLocal.error(exception);
        process.exit(1);
    });
};
