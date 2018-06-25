import { IPluginDestinationMap } from '@testring/typings';
import { BrowserProxyAPI } from './modules/browser-proxy';
import { TestFinderAPI } from './modules/test-finder';
import { LoggerAPI } from './modules/logger';

export class PluginAPI {
    constructor(private pluginName: string, private modules: IPluginDestinationMap) {}

    getLogger() {
        return new LoggerAPI(this.pluginName, this.modules.logger);
    }

    getTestFinder() {
        return new TestFinderAPI(this.pluginName, this.modules.testFinder);
    }

    getBrowserProxy() {
        return new BrowserProxyAPI(this.pluginName, this.modules.browserProxy);
    }
}
