import { transport } from '@testring/transport';
import { RecorderWorkerController } from './worker/recorder-worker-controller';
import { loggerClient, LoggerServer } from '@testring/logger';

// Only for package run
import { defaultConfiguration } from '../../cli-config/src';

import { defaultRecorderConfig } from './default-recorder-config';

const server = new RecorderWorkerController(transport);

new LoggerServer(defaultConfiguration, transport, process.stdout);

server.init(defaultRecorderConfig).then(async () => {
    //await server.openBrowser();
}).catch((err) => {
    loggerClient.error(err);
});
