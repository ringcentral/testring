import { ITestFinder } from './test-finder';
import { ITestWorker } from './test-worker';

// TODO replace any with real types

export type PluginConfig = object | null;

export type Plugin = (pluginAPI: any, config: PluginConfig) => void;

export interface IPluginDestinationMap {
    logger: any,
    testFinder: ITestFinder & any,
    testWorker: ITestWorker & any,
    testRunController: any,
}
