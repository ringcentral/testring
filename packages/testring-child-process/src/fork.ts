import * as path from 'path';
import * as childProcess from 'child_process';
import { resolveBinary } from './resolve-binary';
import { spawn } from './spawn';

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
    return spawn(getExecutor(filePath), [filePath, ...args]);
};
