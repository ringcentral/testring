import { LogLevel } from '@testring/types';
import { transport } from '@testring/transport';

import { RecorderWorkerController } from './worker/recorder-worker-controller';
import { loggerClient, LoggerServer } from '@testring/logger';

import { defaultRecorderConfig } from './default-recorder-config';


const server = new RecorderWorkerController(transport);

new LoggerServer({
    logLevel: 'verbose' as LogLevel,
    silent: false,
}, transport, process.stdout);

server.init(defaultRecorderConfig).catch((err) => {
    loggerClient.error(err);
});
