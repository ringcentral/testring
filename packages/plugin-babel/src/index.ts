import * as path from 'path';
import { PluginAPI } from '@testring/plugin-api';
import * as babelCore from 'babel-core';

export default (pluginAPI: PluginAPI, config: babelCore.TransformOptions | null) => {
    const testWorker = pluginAPI.getTestWorker();

    testWorker.compile(async (code: string, filename: string) => {
        const opts = {
            sourceMaps: false,
            sourceRoot: process.cwd(),
            sourceFileName: path.relative(process.cwd(), filename),
            ...config,
            filename: filename,
        };
        const result = babelCore.transform(code, opts);

        return result.code || '';
    });
};
