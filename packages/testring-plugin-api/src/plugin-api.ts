import { IPluginModules } from '@testring/types';
import { BrowserProxyAPI } from './modules/browser-proxy';
import { TestFinderAPI } from './modules/test-finder';
import { LoggerAPI } from './modules/logger';
import { TestWorkerAPI } from './modules/test-worker';
import { TestRunControllerAPI } from './modules/test-run-controller';

export class PluginAPI {
    constructor(private pluginName: string, private modules: IPluginModules) {
    }

    getLogger() {
        return new LoggerAPI(this.pluginName, this.modules.logger);
    }

    getTestFinder() {
        if (this.modules.testFinder) {
            return new TestFinderAPI(this.pluginName, this.modules.testFinder);
        }

        return null;
    }

    getTestWorker() {
        return new TestWorkerAPI(this.pluginName, this.modules.testWorker);
    }

    getTestRunController() {
        return new TestRunControllerAPI(this.pluginName, this.modules.testRunController);
    }

    getBrowserProxy() {
        return new BrowserProxyAPI(this.pluginName, this.modules.browserProxy);
    }

    getHttpClient() {
        return this.modules.httpClientInstance;
    }
}
