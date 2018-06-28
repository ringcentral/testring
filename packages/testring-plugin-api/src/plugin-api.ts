import { IPluginDestinationMap } from '@testring/types';
import { BrowserProxyAPI } from './modules/browser-proxy';
import { TestFinderAPI } from './modules/test-finder';
import { LoggerAPI } from './modules/logger';
import { TestRunControllerAPI } from './modules/test-run-controller';

export class PluginAPI {
    constructor(private pluginName: string, private modules: IPluginDestinationMap) {}

    getLogger() {
        return new LoggerAPI(this.pluginName, this.modules.logger);
    }

    getTestFinder() {
        return new TestFinderAPI(this.pluginName, this.modules.testFinder);
    }

    getTestRunController() {
        return new TestRunControllerAPI(this.pluginName, this.modules.testRunController);
    }

    getBrowserProxy() {
        return new BrowserProxyAPI(this.pluginName, this.modules.browserProxy);
    }
}
