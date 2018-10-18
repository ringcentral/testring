import { createHttpServer, HttpClientLocal, HttpServer } from '@testring/http-api';
import { LoggerServer, loggerClientLocal } from '@testring/logger';
import { TestRunController } from '@testring/test-run-controller';
import { applyPlugins } from '@testring/plugin-api';
import { FSReader } from '@testring/fs-reader';
import { TestWorker } from '@testring/test-worker';
import { WebApplicationController } from '@testring/web-application';
import { browserProxyControllerFactory, BrowserProxyController } from '@testring/browser-proxy';
import { ICLICommand, IConfig, ITransport } from '@testring/types';

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

    private webApplicationController: WebApplicationController;
    private browserProxyController: BrowserProxyController;
    private testRunController: TestRunController;
    private httpServer: HttpServer;

    constructor(private config: IConfig, private transport: ITransport, private stdout: NodeJS.WritableStream) {}

    async execute() {
        const testWorker = new TestWorker(this.transport, {
            debug: this.config.debug,
        });

        this.httpServer = createHttpServer(this.transport);
        this.browserProxyController = browserProxyControllerFactory(this.transport);
        this.testRunController = new TestRunController(this.config, testWorker);
        this.webApplicationController = new WebApplicationController(this.browserProxyController, this.transport);

        const loggerServer = new LoggerServer(this.config, this.transport, this.stdout);
        const fsReader = new FSReader();
        const httpClientParams = {
            httpThrottle: this.config.httpThrottle,
        };
        const httpClient = new HttpClientLocal(this.transport, httpClientParams);

        applyPlugins({
            logger: loggerServer,
            fsReader: fsReader,
            testWorker: testWorker,
            browserProxy: this.browserProxyController,
            testRunController: this.testRunController,
            httpClientInstance: httpClient
        }, this.config);

        loggerClientLocal.info('User config:\n', formatJSON(this.config));

        const tests = await fsReader.find(this.config.tests);

        loggerClientLocal.info(`Found ${tests.length} test(s) to run.`);

        await this.browserProxyController.init();

        this.webApplicationController.init();

        loggerClientLocal.info('Executing...');

        const testRunResult = await this.testRunController.runQueue(tests);

        await this.shutdown();

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
        const httpServer = this.httpServer;
        const testRunController = this.testRunController;
        const browserProxyController = this.browserProxyController;
        const webApplicationController = this.webApplicationController;

        this.httpServer = (null as any);
        this.testRunController = (null as any);
        this.browserProxyController = (null as any);
        this.webApplicationController = (null as any);

        httpServer && httpServer.kill();
        webApplicationController && webApplicationController.kill();
        testRunController && await testRunController.kill();
        browserProxyController && await browserProxyController.kill();
    }
}

export const runTests = (config, transport, stdout) => {
    if (typeof config.tests !== 'string') {
        throw new Error('required field --tests in arguments or config');
    }

    return new RunCommand(config, transport, stdout);
};

