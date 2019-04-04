// import { transport } from '@testring/transport';
// import { loggerClient } from '@testring/logger';

import { RecorderServer } from '../recorder-server';
import { loggerClient } from '@testring/logger';


loggerClient.info('Starting recorder server...');
const server = new RecorderServer();
server.run();

process.on('exit', () => {
    server.kill();
});

// const logger = loggerClient.withPrefix('[recorder-worker]');
// logger.debug('Hello world');
// transport.on('test', (argument) => {
//     logger.debug('message got', argument);
// });
