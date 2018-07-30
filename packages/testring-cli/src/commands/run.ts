import { createHttpServer, HttpClientLocal } from '@testring/http-api';
import { LoggerServer, loggerClientLocal } from '@testring/logger';
import { TestRunController } from '@testring/test-run-controller';
import { applyPlugins } from '@testring/plugin-api';
import { FSReader } from '@testring/fs-reader';
import { TestWorker } from '@testring/test-worker';
import { WebApplicationController } from '@testring/web-application';
import { browserProxyControllerFactory, BrowserProxyController } from '@testring/browser-proxy';
import { transport } from '@testring/transport';
import { ICLICommand, IConfig } from '@testring/types';

const formatJSON = (obj: any) => {
    const separator = '⋅';
    const padding = 20;

    let str = separator.repeat(padding) + '\n';
    let item;

    for (const key in obj) {
        if (key === 'plugins') {
            item = obj[key].toString()
                .replace(/\[object Object]/g, '')
                .replace(/,,/g, ',');
        } else {
            item = JSON.stringify(obj[key]);
        }

        str += `${(key + ' ').padEnd(padding, separator)} ${item}\n`;
    }

    return str + separator.repeat(padding);
};

class RunCommand implements ICLICommand {

    private browserProxyController: BrowserProxyController;

    constructor(private config: IConfig, private stdout: NodeJS.WritableStream) {}
    
    async execute() {
        createHttpServer(this.config, transport);

        this.browserProxyController = browserProxyControllerFactory(transport);

        const loggerServer = new LoggerServer(this.config, transport, this.stdout);
        const fsReader = new FSReader();
        const testWorker = new TestWorker(transport);
        const testRunController = new TestRunController(this.config, testWorker);
        const webApplicationController = new WebApplicationController(this.browserProxyController, transport);
        const httpClient = new HttpClientLocal(transport);

        applyPlugins({
            logger: loggerServer,
            fsReader: fsReader,
            testWorker: testWorker,
            browserProxy: this.browserProxyController,
            testRunController: testRunController,
            httpClientInstance: httpClient
        }, this.config);

        loggerClientLocal.info('User config:\n', formatJSON(this.config));

        const tests = await fsReader.find(this.config.tests);

        loggerClientLocal.info(`Found ${tests.length} test(s) to run.`);

        await this.browserProxyController.spawn();

        webApplicationController.init();

        loggerClientLocal.info('Executing...');

        const testRunResult = await testRunController.runQueue(tests);

        this.browserProxyController.kill();

        if (testRunResult) {
            loggerClientLocal.error('Founded errors:');

            testRunResult.forEach((error) => {
                loggerClientLocal.error(error);
            });

            throw `Failed ${testRunResult.length}/${tests.length} tests.`;
        } else {
            loggerClientLocal.info(`Tests done: ${tests.length}/${tests.length}.`);
        }
    }

    async shutdown() {
        this.browserProxyController.kill();
    }
}

export const runTests = (config, stdout) => {
    if (typeof config.tests !== 'string') {
        throw new Error('required field --tests in arguments or config');
    }
    
    return new RunCommand(config, stdout);
};

