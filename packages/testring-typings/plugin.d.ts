
// TODO replace any with real types

export type PluginConfig = object | null;

export type Plugin = (pluginAPI: any, config: PluginConfig) => void;

export interface IPluginDestinationMap {
    logger: any,
    testFinder: any,
    testWorker: any
}
