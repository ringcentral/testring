import * as path from 'path';
import * as childProcess from 'child_process';
import { spawn } from './spawn';

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

export const fork = (filePath: string, args: Array<string> = []): childProcess.ChildProcess => {
    return spawn('node', [...getAdditionalParameters(filePath), filePath, ...args]);
};
