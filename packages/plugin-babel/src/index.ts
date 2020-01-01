import * as path from 'path';
import { PluginAPI } from '@testring/plugin-api';
import * as babelCore from 'babel-core';

// eslint-disable-next-line import/no-default-export
export default (pluginAPI: PluginAPI, config: babelCore.TransformOptions | null) => {
    const testWorker = pluginAPI.getTestWorker();

    testWorker.compile(async (code: string, filename: string) => {
        const opts = {
            sourceMaps: false,
            sourceRoot: process.cwd(),
            sourceFileName: path.relative(process.cwd(), filename),
            ...config,
            filename,
        };
        const result = babelCore.transform(code, opts);

        return result.code || '';
    });
};
