import { LogLevel } from '@testring/types';
import { transport } from '@testring/transport';

import { DevtoolWorkerController } from './worker/devtool-worker-controller';
import { loggerClient, LoggerServer } from '@testring/logger';

import { defaultDevtoolConfig } from './default-devtool-config';


const server = new DevtoolWorkerController(transport);

new LoggerServer({
    logLevel: 'verbose' as LogLevel,
    silent: false,
}, transport);

server.init(defaultDevtoolConfig).catch((err) => {
    loggerClient.error(err);
});
