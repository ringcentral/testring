import * as path from 'path';
import * as process from 'process';
import * as childProcess from 'child_process';
import { getAvailablePort } from '@testring/utils';
import { resolveBinary } from './resolve-binary';
import { spawn } from './spawn';

const getNumberRange = (start: number, end: number): Array<number> => {
    const length = start - end;

    return Array.from({ length }, (x, i) => i + start);
};

const PREFERED_DEBUG_PORTS: Array<number> = [
    /* Default debug ports */
    9229,
    9222,
    /* A few ports from 9230 - 9240 */
    ...getNumberRange(9230, 9240),
];
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

export async function fork(
    filePath: string,
    args: Array<string> = [],
    debugEnabled: boolean = false
): Promise<childProcess.ChildProcess> {
    let processArgs: Array<string> = [];

    if (debugEnabled) {
        let port = await getAvailablePort(PREFERED_DEBUG_PORTS);

        processArgs = [`--inspect-brk=${port}`];
    }

    if (IS_WIN) {
        return spawn(
            'node',
            [...processArgs, ...getAdditionalParameters(filePath), filePath, ...args]
        );
    } else {
        return spawn(
            getExecutor(filePath),
            [...processArgs, filePath, ...args]
        );
    }
}
