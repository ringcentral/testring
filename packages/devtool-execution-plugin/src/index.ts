import { transformAsync } from '@babel/core';
import { devToolExecutionWrapper } from './babel-devtool-execution-wrapper';

export const devtoolExecutionWrapper = async (source: string, filename: string): Promise<string> => {
    const result = await transformAsync(source, {
        filename,
        sourceMaps: 'inline',
        plugins: [
            devToolExecutionWrapper,
        ],
    });

    if (result === null || result.code === null || result.code === undefined) {
        throw Error('Failed to parse file');
    } else {
        return result.code;
    }
};

export { IMPORT_PATH } from './babel-devtool-execution-wrapper';

export { broadcastStartScope, broadcastStopScope } from './devtool-execution-messenger';
