import { LoggerServer, loggerClientLocal } from '@testring/logger';
import { TestRunController } from '@testring/test-run-controller';
import { applyPlugins } from '@testring/plugin-api';
import { TestsFinder } from '@testring/test-finder';
import { TestWorker } from '@testring/test-worker';
import { getConfig } from '@testring/cli-config';
import { WebApplicationController } from '@testring/web-application';
import { browserProxyControllerFactory } from '@testring/browser-proxy';
import { transport } from '@testring/transport';

const formatJSON = (obj: any) => {
    const separator = '⋅';
    const padding = 20;

    let str = separator.repeat(padding) + '\n';
    let item;

    for (const key in obj) {
        if (key === 'plugins') {
            item = obj[key].toString()
                .replace(/\[object Object]/g, '')
                .replace(/, ,/g, ',');
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
    const browserProxyController = browserProxyControllerFactory(transport);
    const webApplicationController = new WebApplicationController(browserProxyController, transport);

    applyPlugins({
        logger: loggerServer,
        testFinder: testFinder,
        testWorker: testWorker,
        browserProxy: browserProxyController,
        testRunController: testRunController
    }, userConfig);

    loggerClientLocal.info('User config:\n', formatJSON(userConfig));

    const tests = await testFinder.find(userConfig.tests);

    loggerClientLocal.info(`Found ${tests.length} test(s) to run.`);

    await browserProxyController.spawn();

    webApplicationController.init();

    const testRunResult = await testRunController.runQueue(tests);

    browserProxyController.kill();

    if (testRunResult) {
        loggerClientLocal.error('Founded errors:');

        testRunResult.forEach((error) => {
            loggerClientLocal.error(error);
        });

        throw `Failed ${testRunResult.length}/${tests.length} tests.`;
    } else {
        loggerClientLocal.info(`Tests done: ${tests.length}/${tests.length}.`);
    }
};

