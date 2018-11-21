import { RecorderServerMessageTypes, ICLICommand, IConfig, ITransport } from '@testring/types';
import { browserProxyControllerFactory } from '@testring/browser-proxy';
import { createHttpServer, HttpClient } from '@testring/http-api';
import { WebApplicationController } from '@testring/web-application';
import { LoggerServer, loggerClient } from '@testring/logger';
import { TestRunController } from '@testring/test-run-controller';
import { RecorderServer } from '@testring/recorder-backend';
import { applyPlugins } from '@testring/plugin-api';
import { TestWorker } from '@testring/test-worker';

class RecordCommand implements ICLICommand {

    constructor(private config: IConfig, private transport: ITransport, private stdout: NodeJS.WritableStream) {}

    async execute() {
        createHttpServer(this.transport);

        const loggerServer = new LoggerServer(this.config, this.transport, this.stdout);
        const testWorker = new TestWorker(this.transport, {
            debug: this.config.debug,
            localWorker: this.config.localWorker,
        });
        const testRunController = new TestRunController(this.config, testWorker);
        const browserProxyController = browserProxyControllerFactory(this.transport);
        const webApplicationController = new WebApplicationController(browserProxyController, this.transport);
        const httpClient = new HttpClient(this.transport, {
            httpThrottle: this.config.httpThrottle,
        });
        const recorderServer = new RecorderServer();

        applyPlugins({
            logger: loggerServer,
            testWorker: testWorker,
            browserProxy: browserProxyController,
            testRunController: testRunController,
            httpClientInstance: httpClient
        }, this.config);

        await browserProxyController.init();
        await recorderServer.run();

        webApplicationController.init();

        loggerClient.info('Recorder Server started');

        this.transport.on(RecorderServerMessageTypes.MESSAGE, async (message) => {
            const testStr = message.payload;

            try {
                const testResult = await testRunController.pushTestIntoQueue(testStr);

                loggerClient.info(`Test executed with result: ${testResult}`);
            } catch (e) {
                loggerClient.info(`Test executed failed with error: ${e}`);
            }
        });

        this.transport.on(RecorderServerMessageTypes.CLOSE, () => {
            throw new Error('Recorder Server disconnected');
        });
    }

    async shutdown() {
        // TODO stop all processes
    }
}

export const runRecordingProcess = (config, transport, stdout) => {
    return new RecordCommand(config, transport, stdout);
};

