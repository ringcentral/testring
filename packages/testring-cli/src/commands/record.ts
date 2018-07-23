import { RecorderServerMessageTypes, ICLICommand, IConfig  } from '@testring/types';
import { browserProxyControllerFactory } from '@testring/browser-proxy';
import { createHttpServer, HttpClientLocal } from '@testring/http-api';
import { WebApplicationController } from '@testring/web-application';
import { LoggerServer, loggerClientLocal } from '@testring/logger';
import { TestRunController } from '@testring/test-run-controller';
import { RecorderServer } from '@testring/recorder-backend';
import { applyPlugins } from '@testring/plugin-api';
import { TestWorker } from '@testring/test-worker';
import { transport } from '@testring/transport';

class RecordCommand implements ICLICommand {

    constructor(private config: IConfig, private stdout: NodeJS.WritableStream) {}

    async execute() {
        createHttpServer(this.config, transport);

        const loggerServer = new LoggerServer(this.config, transport, this.stdout);
        const testWorker = new TestWorker(transport);
        const testRunController = new TestRunController(this.config, testWorker);
        const browserProxyController = browserProxyControllerFactory(transport);
        const webApplicationController = new WebApplicationController(browserProxyController, transport);
        const httpClient = new HttpClientLocal(transport);
        const recorderServer = new RecorderServer();

        applyPlugins({
            logger: loggerServer,
            testWorker: testWorker,
            browserProxy: browserProxyController,
            testRunController: testRunController,
            httpClientInstance: httpClient
        }, this.config);

        await browserProxyController.spawn();
        await recorderServer.run();

        webApplicationController.init();

        loggerClientLocal.info('Recorder Server started');

        transport.on(RecorderServerMessageTypes.MESSAGE, async (message) => {
            const testStr = message.payload;

            try {
                const testResult = await testRunController.pushTestIntoQueue(testStr);

                loggerClientLocal.info(`Test executed with result: ${testResult}`);
            } catch (e) {
                loggerClientLocal.info(`Test executed failed with error: ${e}`);
            }
        });

        transport.on(RecorderServerMessageTypes.CLOSE, () => {
            throw new Error('Recorder Server disconnected');
        });
    }

    async shutdown() {
        // TODO stop all processes
    }
}

export const runRecordingProcess = (config, stdout) => {
    return new RecordCommand(config, stdout);
};

