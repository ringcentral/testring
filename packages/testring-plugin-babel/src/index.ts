import { PluginAPI } from '@testring/plugin-api';
import * as babelCore from 'babel-core';

export default (pluginAPI: PluginAPI, config: babelCore.TransformOptions | null) => {
    const testWorker = pluginAPI.getTestWorker();

    testWorker.compile(async (code: string, filename: string) => {
        const result = babelCore.transform(code, {
            ...config,
            filename: filename,
            sourceMaps: false,
            sourceRoot: process.cwd()
        });

        return result.code || '';
    });
};
