import {
    IRecorderHttpRoute,
    IRecorderServerConfig,
    IRecorderWebAppRegisterMessage,
    ITransport,
    RecorderWorkerMessages,
    WebApplicationDevtoolMessageType,
} from '@testring/types';

import { Store } from 'redux';
import { loggerClient } from '@testring/logger';

import { RecorderHttpServer } from './recorder-http-server';
import { RecorderWSServer } from './recorder-ws-server';
import { initStore } from './store';

export class RecorderWorkerController {
    private logger = loggerClient.withPrefix('[recorder-worker]');

    private httpServer: RecorderHttpServer;

    private wsServer: RecorderWSServer;

    private store: Store;

    private config: IRecorderServerConfig;

    constructor(private transport: ITransport) {
        this.transport.on(RecorderWorkerMessages.START_SERVER, (config: IRecorderServerConfig) => {
            this.init(config);
        });

        this.addDevtoolMessageListeners();

        process.once('exit', () => this.exitHandler);
    }

    private addDevtoolMessageListeners() {
        this.transport.on<IRecorderWebAppRegisterMessage>(WebApplicationDevtoolMessageType.register, (message) => {
            this.registerWebApplication(message);
        });
        this.transport.on<IRecorderWebAppRegisterMessage>(WebApplicationDevtoolMessageType.unregister, (message) => {
           this.unregisterWebApplication(message);
        });
    }

    private registerWebApplication(message: IRecorderWebAppRegisterMessage) {
        this.logger.debug(message);
        this.transport.broadcastUniversally(WebApplicationDevtoolMessageType.registerComplete, {
            ...message,
            messageData: {
                ...message.messageData,
                error: null,
            },
        });
    }

    private unregisterWebApplication(message: IRecorderWebAppRegisterMessage) {
        this.logger.debug(message);
        this.transport.broadcastUniversally(WebApplicationDevtoolMessageType.unregisterComplete, message);
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
        this.logger.info('Starting recorder servers');
        this.config = config;

        this.store = await initStore({
            recorderConfig: (state = {
                recorderConfig: config,
            }) => state,
        });

        try {
            this.httpServer = new RecorderHttpServer(
                config.host,
                config.httpPort,
                this.getHttpRouter(),
                this.getHttpStaticRouter(),
                this.store,
            );
            await this.httpServer.run();
            this.logger.debug(`Http server listening: ${this.httpServer.getUrl()}`);

            this.wsServer = new RecorderWSServer(
                config.host,
                config.wsPort,
            );
            await this.wsServer.run();
            this.logger.debug(`WS server listening: ${this.wsServer.getUrl()}`);

            this.transport.broadcastUniversally(RecorderWorkerMessages.START_SERVER_COMPLETE, null);
        } catch (err) {
            this.transport.broadcastUniversally(RecorderWorkerMessages.START_SERVER_COMPLETE, err);
        }
    }

    private async exitHandler() {
        if (this.httpServer) {
            try {
                await this.httpServer.stop();
            } catch (err) {
                this.logger.warn(err);
            }
        }

        if (this.wsServer) {
            try {
                await this.wsServer.stop();
            } catch (err) {
                this.logger.warn(err);
            }
        }
    }
}
