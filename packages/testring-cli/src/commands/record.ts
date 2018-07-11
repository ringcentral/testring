import { LoggerServer, loggerClientLocal } from '@testring/logger';
import { TestRunController } from '@testring/test-run-controller';
import { applyPlugins } from '@testring/plugin-api';
import { TestWorker } from '@testring/test-worker';
import { getConfig } from '@testring/cli-config';
import { WebApplicationController } from '@testring/web-application';
import { browserProxyControllerFactory } from '@testring/browser-proxy';
import { transport } from '@testring/transport';
import { RecorderServer } from '@testring/recorder-backend';
import { RecorderServerMessageTypes } from '@testring/types';


export const runRecordingProcess = async (argv: Array<string>, stdout: NodeJS.WritableStream) => {
    const userConfig = await getConfig(argv);

    const loggerServer = new LoggerServer(userConfig, transport, stdout);
    const testWorker = new TestWorker(transport);
    const testRunController = new TestRunController(userConfig, testWorker);
    const browserProxyController = browserProxyControllerFactory(transport);
    const webApplicationController = new WebApplicationController(browserProxyController, transport);
    const recorderServer = new RecorderServer();

    applyPlugins({
        logger: loggerServer,
        testWorker: testWorker,
        browserProxy: browserProxyController,
        testRunController: testRunController
    }, userConfig);

    await browserProxyController.spawn();

    webApplicationController.init();

    await recorderServer.run();

    loggerClientLocal.info('Recorder Server started');

    transport.on(RecorderServerMessageTypes.MESSAGE, async (message) => {
        const testStr = message.payload;
        const conId = message.conId;

        try {
            const testResult = testRunController.pushTestIntoQueue(testStr);
            await transport.send(conId, RecorderServerMessageTypes.MESSAGE, {
                testResult: testResult,
                error: null
            });
        } catch (e) {
            transport.send(conId, RecorderServerMessageTypes.MESSAGE, {
                testResult: '',
                error: e
            });
        }
    });

    transport.on(RecorderServerMessageTypes.CLOSE, () => {
        throw new Error('Recorder Server disconnected');
    });

};

