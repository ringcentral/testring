import * as path from 'path';
import { Transport } from '@testring/transport';
import { fork } from '@testring/child-process';

import { BrowserProxyController } from './browser-proxy-controller';
import { BrowserProxy } from './browser-proxy';

export * from './structs';

const WORKER_PATH = path.join(__dirname, './browser-proxy');

const browserProxyControllerFactory = (transport: Transport) => {
    return new BrowserProxyController(transport, (pluginName, config) => {
        return fork(WORKER_PATH, [
            pluginName,
            JSON.stringify(config)
        ]);
    });
};

export {
    BrowserProxy,
    BrowserProxyController,
    browserProxyControllerFactory
};
