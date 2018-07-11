import * as childProcess from 'child_process';
import { spawn } from './spawn';

const EMPTY_PARAMETERS = [];
const REQUIRE_TS_NODE = ['-r', 'ts-node/register'];

const getAdditionalParameters = (): Array<string> => {
    return require.extensions['.ts'] ?
        REQUIRE_TS_NODE :
        EMPTY_PARAMETERS;
};

export const fork = (filePath: string, args: Array<string> = []): childProcess.ChildProcess => {
    return spawn('node', [...getAdditionalParameters(), filePath, ...args]);
};
