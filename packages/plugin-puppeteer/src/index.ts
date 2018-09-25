import * as path from 'path';
import { LaunchOptions } from 'puppeteer';
import { PluginAPI } from '@testring/plugin-api';

export default function(pluginAPI: PluginAPI, userConfig: LaunchOptions) {
    const pluginPath = path.join(__dirname, './plugin');
    const browserProxy = pluginAPI.getBrowserProxy();

    browserProxy.proxyPlugin(pluginPath, userConfig);
}
