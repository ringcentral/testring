import {
    DEFAULT_RECORDER_HOST,
    DEFAULT_RECORDER_HTTP_PORT,
    DEFAULT_RECORDER_WS_PORT,
} from './constants';
import { IDevtoolServerConfig } from '@testring/types';
import { getAvailablePort } from '@testring/utils';

import * as path from 'path';

import { absolutePath as FRONTEND_PATH } from '@testring/devtool-frontend';

const getRouterPath = (filepath) => path.resolve(__dirname, './routes/', filepath);

export const defaultDevtoolConfig: IDevtoolServerConfig = {
    host: DEFAULT_RECORDER_HOST,
    httpPort: DEFAULT_RECORDER_HTTP_PORT,
    wsPort: DEFAULT_RECORDER_WS_PORT,
    router: [
        {
            method: 'get',
            mask: '/editor',
            handler: getRouterPath('editor-page'),
        },
        {
            method: 'get',
            mask: '/popup',
            handler: getRouterPath('popup-page'),
        },
    ],
    staticRoutes: {
        'recorder-frontend': {
            'rootPath': '/static',
            'directory': FRONTEND_PATH,
        },
    },
};

export async function getDevtoolConfig(
    host: string = 'localhost',
    _httpPort?: number,
    _wsPort?: number,
): Promise<IDevtoolServerConfig> {
    let httpPort: number;
    let wsPort: number;

    if (typeof _httpPort === 'number') {
        httpPort = _httpPort;
    } else {
        httpPort = await getAvailablePort([DEFAULT_RECORDER_HTTP_PORT], host);
    }

    if (typeof _wsPort === 'number') {
        wsPort = _wsPort;
    } else {
        wsPort = await getAvailablePort([DEFAULT_RECORDER_WS_PORT], host);
    }

    return {
        ...defaultDevtoolConfig,
        httpPort,
        wsPort,
    };
}
