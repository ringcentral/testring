import {IHttpClient, IPluginModules} from '@testring/types';
import {BrowserProxyAPI} from './modules/browser-proxy';
import {FSReaderAPI} from './modules/fs-reader';
import {LoggerAPI} from './modules/logger';
import {TestWorkerAPI} from './modules/test-worker';
import {TestRunControllerAPI} from './modules/test-run-controller';
import {DevtoolAPI} from './modules/devtool';
import {HttpServerAPI} from './modules/http-server';
import {FSStoreServerAPI} from './modules/fs-store-server';

export class PluginAPI {
    constructor(private pluginName: string, private modules: IPluginModules) {}

    getLogger(): LoggerAPI {
        return new LoggerAPI(this.pluginName, this.modules.logger);
    }

    getFSReader(): FSReaderAPI | null {
        if (this.modules.fsReader) {
            return new FSReaderAPI(this.pluginName, this.modules.fsReader);
        }

        return null;
    }

    getTestWorker(): TestWorkerAPI {
        return new TestWorkerAPI(this.pluginName, this.modules.testWorker);
    }

    getTestRunController(): TestRunControllerAPI {
        return new TestRunControllerAPI(
            this.pluginName,
            this.modules.testRunController,
        );
    }

    getBrowserProxy(): BrowserProxyAPI {
        return new BrowserProxyAPI(this.pluginName, this.modules.browserProxy);
    }

    getHttpServer(): HttpServerAPI {
        return new HttpServerAPI(this.pluginName, this.modules.httpServer);
    }

    getHttpClient(): IHttpClient {
        return this.modules.httpClientInstance;
    }

    getDevtool(): DevtoolAPI {
        return new DevtoolAPI(this.pluginName, this.modules.devtool);
    }

    getFSStoreServer(): FSStoreServerAPI {
        return new FSStoreServerAPI(
            this.pluginName,
            this.modules.fsStoreServer,
        );
    }
}
