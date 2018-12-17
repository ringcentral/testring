import { BrowserProxyPlugins } from '@testring/types';
import { AbstractAPI } from './abstract';

export class BrowserProxyAPI extends AbstractAPI {

    private static currentPlugin: string;

    proxyPlugin(pluginPath: string, config: object) {
        if (BrowserProxyAPI.currentPlugin) {
            throw new Error(
                `Plugin ${BrowserProxyAPI.currentPlugin} already registered as browser proxy!`
            );
        }

        BrowserProxyAPI.currentPlugin = this.pluginName;

        const hook = this.module.getHook(BrowserProxyPlugins.getPlugin);

        if (hook) {
            hook.writeHook(this.pluginName, async () => ({
                plugin: pluginPath,
                config: config,
            }));
        }
    }
}
