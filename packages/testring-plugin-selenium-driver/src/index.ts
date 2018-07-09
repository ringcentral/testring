import * as path from 'path';
import { Config } from 'webdriverio';
import { PluginAPI } from '@testring/plugin-api';

export default function(pluginAPI: PluginAPI, userConfig: Config) {
    const pluginPath = path.join(__dirname, './plugin');
    const browserProxy = pluginAPI.getBrowserProxy();

    browserProxy.proxyPlugin(pluginPath, userConfig);
}
