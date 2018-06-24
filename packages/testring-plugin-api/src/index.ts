import { IConfig, IPluginDestinationMap } from '@testring/typings';
import { PluginController } from './plugin-controller';
import { findPlugin } from './plugin-finder';
import { PluginAPI } from './plugin-api';

const applyPlugins = (pluginsDestinations: IPluginDestinationMap, config: IConfig) => {
    const controller = new PluginController(pluginsDestinations);

    controller.initialize(config.plugins);
};

export { PluginAPI, findPlugin, applyPlugins };
