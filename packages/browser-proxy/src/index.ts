import * as path from 'path';
import {fork} from '@testring-dev/child-process';
import {ITransport, IChildProcessForkOptions} from '@testring-dev/types';
import {BrowserProxyController} from './browser-proxy-controller';

const WORKER_PATH = path.join(__dirname, './browser-proxy');

const browserProxyControllerFactory = (transport: ITransport) => {
    return new BrowserProxyController(transport, (pluginName, config = {}) => {
        const forkOptions: Partial<IChildProcessForkOptions> = {};

        if (config && config.debug) {
            forkOptions.debug = true;
        }

        return fork(
            WORKER_PATH,
            ['--name', pluginName, '--config', JSON.stringify(config)],
            forkOptions,
        );
    });
};

export {BrowserProxyController, browserProxyControllerFactory};
