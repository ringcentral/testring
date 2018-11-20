import * as path from 'path';
import * as process from 'process';
import { getAvailablePort } from '@testring/utils';
import { IChildProcessForkOptions, IChildProcess } from '@testring/types';
import { resolveBinary } from './resolve-binary';
import { spawn } from './spawn';

const getNumberRange = (start: number, end: number): Array<number> => {
    const length = start - end;

    return Array.from({ length }, (x, i) => i + start);
};

const PREFERRED_DEBUG_PORTS: Array<number> = [
    /* Default debug ports */
    9229,
    9222,
    /* A few ports from 9230 - 9240 */
    ...getNumberRange(9230, 9240),
];
const IS_WIN = process.platform === 'win32';
const EMPTY_PARAMETERS = [];
const REQUIRE_TS_NODE = ['-r', 'ts-node/register'];

const DEFAULT_FORK_OPTIONS: IChildProcessForkOptions = {
    debug: false,
    debugPortRange: PREFERRED_DEBUG_PORTS
};


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

const getForkOptions = (options: Partial<IChildProcessForkOptions>): IChildProcessForkOptions => ({
    ...DEFAULT_FORK_OPTIONS,
    ...options,
});

export async function fork(
    filePath: string,
    args: Array<string> = [],
    options: Partial<IChildProcessForkOptions> = {},
): Promise<IChildProcess> {
    const mergedOptions = getForkOptions(options);

    let processArgs: Array<string> = [];
    let debugPort: number | null = null;

    if (mergedOptions.debug) {
        debugPort = await getAvailablePort(mergedOptions.debugPortRange);

        processArgs = [`--inspect-brk=${debugPort}`];
    }

    let process;
    if (IS_WIN) {
        process = spawn(
            'node',
            [...processArgs, ...getAdditionalParameters(filePath), filePath, ...args]
        );
    } else {
        process = spawn(
            getExecutor(filePath),
            [...processArgs, filePath, ...args]
        );
    }

    process.debugPort = debugPort;

    return process;
}

