import { IConfig, IPluginDestinationMap } from '@testring/types';
import { PluginController } from './plugin-controller';

export const applyPlugins = (pluginsDestinations: IPluginDestinationMap, config: IConfig) => {
    const controller = new PluginController(pluginsDestinations);

    controller.initialize(config.plugins);
};
