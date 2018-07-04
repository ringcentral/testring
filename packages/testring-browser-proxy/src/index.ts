import * as path from 'path';
import { Transport } from '@testring/transport';
import { fork } from '@testring/child-process';

import { BrowserProxyController } from './browser-proxy-controller';

const WORKER_PATH = path.join(__dirname, './browser-proxy/index.js');

const browserProxyControllerFactory = (transport: Transport) => {
    return new BrowserProxyController(transport, (pluginName, config) => {
        console.log(WORKER_PATH, pluginName, config);

        return fork(WORKER_PATH, [
            pluginName,
            JSON.stringify(config)
        ]);
    });
};

export {
    BrowserProxyController,
    browserProxyControllerFactory
};
