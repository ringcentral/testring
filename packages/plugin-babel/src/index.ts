import * as path from 'path';
import {PluginAPI} from '@testring-dev/plugin-api';
import * as babelCore from '@babel/core';

export const babelPlugins = [
    [
        require('@babel/plugin-transform-modules-commonjs'),
        {
            strictMode: false,
        },
    ],
];
const babelPlugin = (
    pluginAPI: PluginAPI,
    config: babelCore.TransformOptions | null = {},
): void => {
    const testWorker = pluginAPI.getTestWorker();

    testWorker.compile(async (code: string, filename: string) => {
        const opts = {
            sourceFileName: path.relative(process.cwd(), filename),
            sourceMaps: false,
            sourceRoot: process.cwd(),
            ...config,
            plugins: [...babelPlugins, ...(config?.plugins || [])],
            filename,
        };
        const result = await babelCore.transformAsync(code, opts);

        return result?.code || '';
    });
};

export default babelPlugin;
