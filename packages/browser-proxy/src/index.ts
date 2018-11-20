import * as path from 'path';
import { fork } from '@testring/child-process';
import { ITransport, IChildProcessForkOptions } from '@testring/types';
import { BrowserProxyController } from './browser-proxy-controller';

const WORKER_PATH = path.join(__dirname, './browser-proxy');

const browserProxyControllerFactory = (transport: ITransport) => {
    return new BrowserProxyController(transport, (pluginName, config = {}) => {
        let forkOptions: Partial<IChildProcessForkOptions> = {};

        if (config.debug) {
            forkOptions.debug = true;
        }

        return fork(WORKER_PATH, [
            '--name',
            pluginName,
            '--config',
            JSON.stringify(config)
        ], forkOptions);
    });
};

export {
    BrowserProxyController,
    browserProxyControllerFactory
};
