import * as path from 'path';
import { PluginAPI } from '@testring/plugin-api';
import * as babelCore from '@babel/core';

export const babelPlugins = [
    [require('@babel/plugin-transform-modules-commonjs'), {
        strictMode: false,
    }],
];
// eslint-disable-next-line import/no-default-export
export default (pluginAPI: PluginAPI, config: babelCore.TransformOptions | null = {}) => {
    const testWorker = pluginAPI.getTestWorker();

    testWorker.compile(async (code: string, filename: string) => {
        const opts = {
            sourceFileName: path.relative(process.cwd(), filename),
            sourceMaps: false,
            sourceRoot: process.cwd(),
            ...(config),
            plugins: [
                ...babelPlugins,
                ...(config?.plugins || []),
            ],
            filename,
        };
        const result = await babelCore.transformAsync(code, opts);

        return result?.code || '';
    });
};
