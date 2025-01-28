import {IConfig, IPluginModules} from '@testring/types';
import {PluginController} from './plugin-controller';
import {PluginAPI} from './plugin-api';

const applyPlugins = (
    pluginsDestinations: IPluginModules,
    config: IConfig,
): void => {
    const controller = new PluginController(pluginsDestinations);

    controller.initialize(config.plugins);
};

export {applyPlugins, PluginAPI};
