import { ITestFinder } from './test-finder';
import { ITestWorker } from './test-worker';
import { ITestRunController } from './test-run-controller';
import { IPluggableModule } from './pluggable-module';

export type PluginConfig = object | null;

export type Plugin = (pluginAPI: any, config: PluginConfig) => void;

export interface IPluginDestinationMap {
    logger: any,
    testFinder: ITestFinder & IPluggableModule,
    testWorker: ITestWorker & IPluggableModule,
    testRunController: ITestRunController & IPluggableModule,
}
