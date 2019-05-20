import { transformAsync } from '@babel/core';
import { devToolExecutionWrapper } from './babel-devtool-execution-wrapper';

const babelPluginTransofrmFunctionBind = require('babel-plugin-transform-function-bind');

export const devtoolExecutionWrapper = async (source: string, filename: string): Promise<string> => {
    const result = await transformAsync(source, {
        filename,
        sourceMaps: 'inline',
        plugins: [
            babelPluginTransofrmFunctionBind,
            devToolExecutionWrapper,
        ],
    });

    return result.code;
};

export { IMPORT_PATH } from './babel-devtool-execution-wrapper';

export { broadcastStartScope, broadcastStopScope } from './devtool-execution-messenger';
