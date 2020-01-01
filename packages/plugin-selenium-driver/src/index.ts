import * as path from 'path';
import { SeleniumPluginConfig } from './types';
import { PluginAPI } from '@testring/plugin-api';

// eslint-disable-next-line import/no-default-export
export default function (pluginAPI: PluginAPI, userConfig: SeleniumPluginConfig) {
    const pluginPath = path.join(__dirname, './plugin');
    const browserProxy = pluginAPI.getBrowserProxy();

    browserProxy.proxyPlugin(pluginPath, userConfig || {});
}
