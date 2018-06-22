import { ConfigPluginDescriptor, IConfig, IPluginDestinationMap } from '@testring/typings';
import { PluginAPI } from './plugin-api';
import { findPlugin } from './plugin-finder';

export class PluginController {

    constructor(private modulesList: IPluginDestinationMap) {}

    public initialize(plugins: IConfig['plugins']) {
        if (!plugins || !Array.isArray(plugins)) {
            return;
        }

        for (let index = 0; index < plugins.length; index++) {
            this.processPlugin(plugins[index], index);
        }
    }

    private processPlugin(plugin: ConfigPluginDescriptor, index: number) {
        let pluginName: string;
        let pluginConfig: object | null;

        if (typeof plugin === 'string') {
            pluginName = plugin;
            pluginConfig = null;
        } else if (Array.isArray(plugin)) {
            pluginName = plugin[0];
            pluginConfig = plugin[1];
        } else {
            throw new SyntaxError(`Invalid plugin. Index: ${index}, got ${JSON.stringify(plugin)}`);
        }

        const importedPlugin = findPlugin(pluginName);

        if (typeof importedPlugin !== 'function') {
            throw new SyntaxError([
                `Plugin ${pluginName} has incorrect format, it should be function!`,
                'Please, follow plugin handbook in testring docs to get more info about API.'
            ].join('\n'));
        }

        const apiInstance = new PluginAPI(pluginName, this.modulesList);

        importedPlugin(apiInstance, pluginConfig);
    }
}
