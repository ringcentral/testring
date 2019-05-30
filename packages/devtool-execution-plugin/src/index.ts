import { transformAsync } from '@babel/core';
import { BabelDevtoolTransform } from './babel-devtool-transform';

export const devtoolExecutionWrapper = async (source: string, filename: string): Promise<string> => {
    const result = await transformAsync(source, {
        filename,
        sourceMaps: 'inline',
        plugins: [
            BabelDevtoolTransform.getBabelPlugin,
        ],
        babelrc: false,
    });

    if (result === null || result.code === null || result.code === undefined) {
        throw Error('Failed to parse file');
    } else {
        return result.code;
    }
};

export { IMPORT_PATH } from './constants';

export { startScope, endScope } from './devtool-execution-messenger';
