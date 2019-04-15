import { createHttpServer, HttpClient, HttpServer } from '@testring/http-api';
import { LoggerServer, loggerClient } from '@testring/logger';
import { TestRunController } from '@testring/test-run-controller';
import { applyPlugins } from '@testring/plugin-api';
import { FSReader } from '@testring/fs-reader';
import { TestWorker } from '@testring/test-worker';
import { WebApplicationController } from '@testring/web-application';
import { browserProxyControllerFactory, BrowserProxyController } from '@testring/browser-proxy';
import { ICLICommand, IConfig, ITransport, RecorderServerMessageTypes } from '@testring/types';
import { RecorderServerController } from '@testring/recorder-backend';


class RunCommand implements ICLICommand {

    private logger = loggerClient;

    private webApplicationController: WebApplicationController;
    private browserProxyController: BrowserProxyController;
    private testRunController: TestRunController;
    private httpServer: HttpServer;
    private recorderServer: RecorderServerController;

    constructor(private config: IConfig, private transport: ITransport, private stdout: NodeJS.WritableStream) {}

    formatJSON(obj: object) {
        const separator = '⋅';
        const padding = 20;

        let str = separator.repeat(padding) + '\n';
        let item;

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (key === 'plugins') {
                    item = obj[key].toString()
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
            waitForRelease: this.config.recorder,
            localWorker: this.config.workerLimit === 'local',
            screenshots: this.config.screenshots,
        });

        this.httpServer = createHttpServer(this.transport);
        this.browserProxyController = browserProxyControllerFactory(this.transport);
        this.testRunController = new TestRunController(this.config, testWorker);
        this.webApplicationController = new WebApplicationController(this.browserProxyController, this.transport);

        const loggerServer = new LoggerServer(this.config, this.transport, this.stdout);
        const fsReader = new FSReader();
        const httpClient = new HttpClient(this.transport, {
            httpThrottle: this.config.httpThrottle,
        });

        applyPlugins({
            logger: loggerServer,
            fsReader: fsReader,
            testWorker: testWorker,
            browserProxy: this.browserProxyController,
            testRunController: this.testRunController,
            httpClientInstance: httpClient,
            recorder: this.recorderServer,
        }, this.config);

        this.logger.info('User config:\n', this.formatJSON(this.config));

        const tests = await fsReader.find(this.config.tests);

        this.logger.info(`Found ${tests.length} test(s) to run.`);

        await this.browserProxyController.init();

        this.webApplicationController.init();

        if (this.config.recorder) {
            await this.initRecorder();
        }

        this.logger.info('Executing...');

        const testRunResult = await this.testRunController.runQueue(tests);

        await this.shutdown();

        if (testRunResult) {
            this.logger.error('Founded errors:');

            testRunResult.forEach((error) => {
                this.logger.error(error);
            });

            throw `Failed ${testRunResult.length}/${tests.length} tests.`;
        } else {
            this.logger.info(`Tests done: ${tests.length}/${tests.length}.`);
        }
    }

    async initRecorder() {
        this.logger.info('Recorder Server is enabled');

        this.recorderServer = new RecorderServerController(this.transport);
        await this.recorderServer.init();

        this.transport.on(RecorderServerMessageTypes.MESSAGE, async (message) => {
            const testStr = message.payload;

            try {
                const testResult = await this.testRunController.pushTestIntoQueue(testStr);

                this.logger.info(`Test executed with result: ${testResult}`);
            } catch (e) {
                this.logger.info(`Test executed failed with error: ${e}`);
            }
        });

        this.transport.on(RecorderServerMessageTypes.CLOSE, () => {
            throw new Error('Recorder Server disconnected');
        });

        this.transport.on(RecorderServerMessageTypes.STOP, () => {
            // TODO Recorder stop handling
        });
    }

    async shutdown() {
        const httpServer = this.httpServer;
        const testRunController = this.testRunController;
        const browserProxyController = this.browserProxyController;
        const webApplicationController = this.webApplicationController;
        const recorderServer = this.recorderServer;

        this.httpServer = (null as any);
        this.testRunController = (null as any);
        this.browserProxyController = (null as any);
        this.webApplicationController = (null as any);
        this.recorderServer = (null as any);

        httpServer && httpServer.kill();
        webApplicationController && webApplicationController.kill();
        testRunController && await testRunController.kill();
        browserProxyController && await browserProxyController.kill();
        recorderServer && await recorderServer.kill();
    }
}

export function runTests(config, transport, stdout) {
    if (typeof config.tests !== 'string') {
        throw new Error('required field --tests in arguments or config');
    }

    return new RunCommand(config, transport, stdout);
}

