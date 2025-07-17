import * as path from 'path';
import { PlaywrightPluginConfig } from './types';
import { PluginAPI } from '@testring/plugin-api';

export default function playwrightPlugin(
    pluginAPI: PluginAPI,
    userConfig: PlaywrightPluginConfig,
): void {
    const pluginPath = path.join(__dirname, './plugin');
    const browserProxy = pluginAPI.getBrowserProxy();

    browserProxy.proxyPlugin(pluginPath, userConfig || {});
}