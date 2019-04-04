import { IPluginModules } from '@testring/types';
import { BrowserProxyAPI } from './modules/browser-proxy';
import { FSReaderAPI } from './modules/fs-reader';
import { LoggerAPI } from './modules/logger';
import { TestWorkerAPI } from './modules/test-worker';
import { TestRunControllerAPI } from './modules/test-run-controller';
import { RecorderAPI } from './modules/recorder';

export class PluginAPI {
    constructor(private pluginName: string, private modules: IPluginModules) {
    }

    getLogger() {
        return new LoggerAPI(this.pluginName, this.modules.logger);
    }

    getFSReader() {
        if (this.modules.fsReader) {
            return new FSReaderAPI(this.pluginName, this.modules.fsReader);
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

    getRecorder() {
        return new RecorderAPI(this.pluginName, this.modules.recorder);
    }
}
