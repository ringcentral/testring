import {createHttpServer, HttpClient, HttpServer} from '@testring/http-api';
import {LoggerServer, loggerClient} from '@testring/logger';
import {TestRunController} from '@testring/test-run-controller';
import {applyPlugins} from '@testring/plugin-api';
import {FSReader} from '@testring/fs-reader';
import {TestWorker} from '@testring/test-worker';
import {WebApplicationController} from '@testring/web-application';
import {
    browserProxyControllerFactory,
    BrowserProxyController,
} from '@testring/browser-proxy';
import {ICLICommand, IConfig, ITransport} from '@testring/types';

import {FSStoreServer} from '@testring/fs-store';

class RunCommand implements ICLICommand {
    private logger = loggerClient;

    private fsWriterQueueServer!: FSStoreServer | null;

    private webApplicationController!: WebApplicationController;
    private browserProxyController!: BrowserProxyController;
    private testRunController!: TestRunController;
    private httpServer!: HttpServer;

    private fsStoreServer: FSStoreServer;

    constructor(
        private config: IConfig,
        private transport: ITransport,
        private stdout: NodeJS.WritableStream,
    ) {
        this.fsStoreServer = new FSStoreServer(config.maxWriteThreadCount);
    }

    formatJSON(obj: Record<string, any>) {
        const separator = '⋅';
        const padding = 20;

        let str = separator.repeat(padding) + '\n';
        let item;

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (key === 'plugins') {
                    item = obj[key]
                        .toString()
                        .replace(/\[object Object]/g, '')
                        .replace(/,,/g, ',');
                } else {
                    item = JSON.stringify(obj[key]);
                }
            }

            str += `${(key + ' ').padEnd(padding, separator)} ${item}\n`;
        }

        return str + separator.repeat(padding);
    }

    async execute() {
        const testWorker = new TestWorker(this.transport, {
            waitForRelease: false,
            localWorker: this.config.workerLimit === 'local',
            screenshots: this.config.screenshots,
        });

        this.httpServer = createHttpServer(this.transport);
        this.browserProxyController = browserProxyControllerFactory(
            this.transport,
        );

        this.testRunController = new TestRunController(
            this.config,
            testWorker,
            null,
        );

        this.webApplicationController = new WebApplicationController(
            this.browserProxyController,
            this.transport,
        );

        const loggerServer = new LoggerServer(
            this.config,
            this.transport,
            this.stdout,
        );
        const fsReader = new FSReader();
        const httpClient = new HttpClient(this.transport, {
            httpThrottle: this.config.httpThrottle,
        });

        applyPlugins(
            {
                logger: loggerServer,
                fsReader,
                fsStoreServer: this.fsStoreServer,
                testWorker,
                browserProxy: this.browserProxyController,
                testRunController: this.testRunController,
                httpClientInstance: httpClient,
                httpServer: this.httpServer,
            },
            this.config,
        );

        this.logger.info('User config:\n', this.formatJSON(this.config));

        const tests = await fsReader.find(this.config.tests);

        this.logger.info(`Found ${tests.length} test(s) to run.`);

        await this.browserProxyController.init();

        this.webApplicationController.init();

        this.logger.info('Executing...');

        const testRunResult = await this.testRunController.runQueue(tests);

        await this.shutdown();

        if (testRunResult) {
            this.logger.error('Founded errors:');

            testRunResult.forEach((error, index) => {
                this.logger.error(`Error ${index + 1}:`, error.message);
                this.logger.error('Stack:', error.stack);
            });

            const errorMessage = `Failed ${testRunResult.length}/${tests.length} tests.`;
            this.logger.error(errorMessage);

            // Ensure proper exit code is set
            const error = new Error(errorMessage);
            (error as any).exitCode = 1;
            (error as any).testFailures = testRunResult.length;
            (error as any).totalTests = tests.length;

            throw error;
        } else {
            this.logger.info(`Tests done: ${tests.length}/${tests.length}.`);
        }
    }

    async shutdown() {
        const httpServer = this.httpServer;
        const testRunController = this.testRunController;
        const browserProxyController = this.browserProxyController;
        const webApplicationController = this.webApplicationController;

        this.httpServer = null as any;
        this.testRunController = null as any;
        this.browserProxyController = null as any;
        this.webApplicationController = null as any;

        this.fsWriterQueueServer && this.fsWriterQueueServer.cleanUpTransport();
        this.fsWriterQueueServer = null as any;

        httpServer && httpServer.kill();
        webApplicationController && webApplicationController.kill();
        testRunController && (await testRunController.kill());
        browserProxyController && (await browserProxyController.kill());
    }
}

interface RunTestsConfig extends IConfig {
    tests: string;
}

export function runTests(
    config: RunTestsConfig,
    transport: ITransport,
    stdout: NodeJS.WritableStream,
): RunCommand {
    if (typeof config.tests !== 'string') {
        throw new Error('required field --tests in arguments or config');
    }

    return new RunCommand(config, transport, stdout);
}
