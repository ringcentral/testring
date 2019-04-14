import { transport } from '@testring/transport';
import { RecorderWorkerController } from './worker/recorder-worker-controller';
import { loggerClient } from '@testring/logger';

import { defaultRecorderConfig } from './default-recorder-config';

const server = new RecorderWorkerController(transport);

server.init(defaultRecorderConfig).then(async () => {
    //await server.openBrowser();
}).catch((err) => {
    loggerClient.error(err);
});
