import {LogLevel} from '@testring-dev/types';
import {transport} from '@testring-dev/transport';

import {DevtoolWorkerController} from './worker/devtool-worker-controller';
import {loggerClient, LoggerServer} from '@testring-dev/logger';

import {defaultDevtoolConfig} from './default-devtool-config';

const server = new DevtoolWorkerController(transport);

new LoggerServer(
    {
        logLevel: 'verbose' as LogLevel,
        silent: false,
    },
    transport,
    process.stdout,
);

server.init(defaultDevtoolConfig).catch((err) => {
    loggerClient.error(err);
});
