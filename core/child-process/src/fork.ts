import * as path from 'path';
import * as process from 'process';
import {getAvailablePort} from '@testring-dev/utils';
import {IChildProcessForkOptions, IChildProcessFork} from '@testring-dev/types';
import {resolveBinary} from './resolve-binary';
import {spawn} from './spawn';

function getNumberRange(start: number, end: number): Array<number> {
    const length = start - end;

    return Array.from({length}, (x, i) => i + start);
}

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
    debugPortRange: PREFERRED_DEBUG_PORTS,
};

function getAdditionalParameters(filePath: string): Array<string> {
    const extension = path.extname(filePath);

    switch (extension) {
        case '.js':
            return EMPTY_PARAMETERS;

        case '.ts':
            return REQUIRE_TS_NODE;

        case '':
            return require.extensions['.ts']
                ? REQUIRE_TS_NODE
                : EMPTY_PARAMETERS;

        default:
            return EMPTY_PARAMETERS;
    }
}

function getExecutor(filePath: string): string {
    const extension = path.extname(filePath);

    switch (extension) {
        case '.js':
            return process.execPath;

        case '.ts':
            return resolveBinary('ts-node');

        case '':
            return require.extensions['.ts']
                ? resolveBinary('ts-node')
                : process.execPath;

        default:
            return process.execPath;
    }
}

const getForkOptions = (
    options: Partial<IChildProcessForkOptions>,
): IChildProcessForkOptions => ({
    ...DEFAULT_FORK_OPTIONS,
    ...options,
});

export async function fork(
    filePath: string,
    args: Array<string> = [],
    options: Partial<IChildProcessForkOptions> = {},
): Promise<IChildProcessFork> {
    const mergedOptions = getForkOptions(options);
    const childArg = `--testring-parent-pid=${process.pid}`;

    const processArgs: Array<string> = [];
    let debugPort: number | null = null;

    if (mergedOptions.debug) {
        debugPort = await getAvailablePort(mergedOptions.debugPortRange);

        processArgs.push(`--inspect-brk=${debugPort}`);
    }

    let childProcess;
    if (IS_WIN) {
        childProcess = spawn('node', [
            ...processArgs,
            ...getAdditionalParameters(filePath),
            filePath,
            childArg,
            ...args,
        ]);
    } else {
        childProcess = spawn(getExecutor(filePath), [
            ...processArgs,
            filePath,
            childArg,
            ...args,
        ]);
    }

    childProcess.debugPort = debugPort;

    return childProcess;
}
