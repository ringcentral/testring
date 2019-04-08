import {
    IRecorderHttpRoute,
    IRecorderServerConfig,
    ITransport,
    RecorderWorkerMessages,
} from '@testring/types';
import { Store } from 'redux';
import { loggerClient } from '@testring/logger';

import { HttpServer } from './http-server';
import { initStore } from './store';

export class RecorderWorkerController {
    private logger = loggerClient.withPrefix('[recorder-worker]');

    private httpServer: HttpServer;

    private store: Store;

    private config: IRecorderServerConfig;

    constructor(private transport: ITransport) {
        this.transport.on(RecorderWorkerMessages.START_SERVER, (config: IRecorderServerConfig) => {
            this.init(config);
        });
        process.once('exit', () => this.exitHandler);
    }

    private loadHandler(filepath: string) {
        let handlerExports = require(filepath);

        if (handlerExports.default) {
            return handlerExports.default;
        }

        return handlerExports;
    }

    private getHttpRouter(): IRecorderHttpRoute[] {
        return this.config.router.map(route => ({
            ...route,
            handler: this.loadHandler(route.handler),
        }));
    }

    private getHttpStaticRouter() {
        return this.config.staticRoutes;
    }

    async init(config: IRecorderServerConfig) {
        this.logger.info('Starting recorder server');
        this.config = config;

        this.store = await initStore({
            recorderConfig: (state = {
                recorderConfig: config,
            }) => state,
        });

        try {
            this.httpServer = new HttpServer(
                config.httpPort,
                config.host,
                this.getHttpRouter(),
                this.getHttpStaticRouter(),
                this.store,
            );
            await this.httpServer.run();
            this.logger.debug(`Http server listening: ${this.httpServer.getUrl()}`);

            this.transport.broadcastUniversally(RecorderWorkerMessages.START_SERVER_COMPLETE, null);
        } catch (err) {
            this.transport.broadcastUniversally(RecorderWorkerMessages.START_SERVER_COMPLETE, err);
        }
    }

    async exitHandler() {
        if (this.httpServer) {
            try {
                await this.httpServer.stop();
            } catch (err) {
                this.logger.warn(err);
            }
        }
    }
}
