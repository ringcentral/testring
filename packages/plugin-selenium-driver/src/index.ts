import * as path from 'path';
import {SeleniumPluginConfig} from './types';
import {PluginAPI} from '@testring-dev/plugin-api';

export default function seleniumPlugin(
    pluginAPI: PluginAPI,
    userConfig: SeleniumPluginConfig,
): void {
    const pluginPath = path.join(__dirname, './plugin');
    const browserProxy = pluginAPI.getBrowserProxy();

    browserProxy.proxyPlugin(pluginPath, userConfig || {});
}
