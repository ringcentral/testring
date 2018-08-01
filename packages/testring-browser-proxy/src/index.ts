import * as path from 'path';
import { fork } from '@testring/child-process';
import { ITransport } from '@testring/types';
import { BrowserProxyController } from './browser-proxy-controller';

const WORKER_PATH = path.join(__dirname, './browser-proxy');

const browserProxyControllerFactory = (transport: ITransport) => {
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
