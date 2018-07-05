import * as path from 'path';
import { Transport } from '@testring/transport';
import { fork } from '@testring/child-process';

import { BrowserProxyController } from './browser-proxy-controller';

const WORKER_PATH = path.join(__dirname, './browser-proxy/index.js');

const browserProxyControllerFactory = (transport: Transport) => {
    return new BrowserProxyController(transport, (pluginName, config) => {

        return fork(WORKER_PATH, [
            '--name',
            pluginName,
            '--config',
            JSON.stringify(config)
        ]);
    });
};

export {
    BrowserProxyController,
    browserProxyControllerFactory
};
