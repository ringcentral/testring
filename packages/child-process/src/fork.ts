import * as path from 'path';
import * as process from 'process';
import * as childProcess from 'child_process';
import { resolveBinary } from './resolve-binary';
import { spawn } from './spawn';

const IS_WIN = process.platform === 'win32';
const EMPTY_PARAMETERS = [];
const REQUIRE_TS_NODE = ['-r', 'ts-node/register'];

const getAdditionalParameters = (filePath: string): Array<string> => {
    const extension = path.extname(filePath);

    switch (extension) {
        case '.js':
            return EMPTY_PARAMETERS;

        case '.ts':
            return REQUIRE_TS_NODE;

        case '':
            return require.extensions['.ts'] ?
                REQUIRE_TS_NODE :
                EMPTY_PARAMETERS;

        default:
            return EMPTY_PARAMETERS;
    }
};

const getExecutor = (filePath: string): string => {
    const extension = path.extname(filePath);

    switch (extension) {
        case '.js':
            return 'node';

        case '.ts':
            return resolveBinary('ts-node');

        case '':
            return require.extensions['.ts'] ?
                resolveBinary('ts-node') :
                'node';

        default:
            return 'node';
    }
};

export const fork = (filePath: string, args: Array<string> = []): childProcess.ChildProcess => {
    if (IS_WIN) {
        return spawn('node', [...getAdditionalParameters(filePath), filePath, ...args]);
    } else {
        return spawn(getExecutor(filePath), [filePath, ...args]);
    }
};
