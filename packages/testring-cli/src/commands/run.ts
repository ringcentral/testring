import { HttpClientLocal } from '@testring/http-api';
import { LoggerServer, loggerClientLocal } from '@testring/logger';
import { TestRunController } from '@testring/test-run-controller';
import { applyPlugins } from '@testring/plugin-api';
import { TestsFinder } from '@testring/test-finder';
import { TestWorker } from '@testring/test-worker';
import { WebApplicationController } from '@testring/web-application';
import { browserProxyControllerFactory } from '@testring/browser-proxy';
import { transport } from '@testring/transport';
import { IConfig } from '@testring/types';

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

export const runTests = async (config: IConfig, stdout: NodeJS.WritableStream) => {
    if (typeof config.tests !== 'string') {
        throw new Error('required field --tests in arguments or config');
    }

    const loggerServer = new LoggerServer(config, transport, stdout);
    const testFinder = new TestsFinder();
    const testWorker = new TestWorker(transport);
    const testRunController = new TestRunController(config, testWorker);
    const browserProxyController = browserProxyControllerFactory(transport);
    const webApplicationController = new WebApplicationController(browserProxyController, transport);
    const httpClient = new HttpClientLocal(transport);

    applyPlugins({
        logger: loggerServer,
        testFinder: testFinder,
        testWorker: testWorker,
        browserProxy: browserProxyController,
        testRunController: testRunController,
        httpClientInstance: httpClient
    }, config);

    loggerClientLocal.info('User config:\n', formatJSON(config));

    const tests = await testFinder.find(config.tests);

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

