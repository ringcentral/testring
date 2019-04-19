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


import { IRecorderWebAppRegisterData, recorderWebAppAction } from '../reducers/web-applications-reducer';
import { recorderConfigActions } from '../reducers/recorder-config-reducer';


export class RecorderWorkerController {
    private logger = loggerClient.withPrefix('[recorder-worker]');

    private httpServer: RecorderHttpServer;

    private wsServer: RecorderWSServer;

    private storesByWorkerId: Map<string, Store> = new Map();

    private config: IRecorderServerConfig;

    constructor(private transport: ITransport) {
        this.transport.on(RecorderWorkerMessages.START_SERVER, (config: IRecorderServerConfig) => {
            this.init(config);
        });

        this.addDevtoolMessageListeners();

        process.once('exit', () => this.exitHandler);
    }

    private async createStore(workerId: string): Promise<Store> {
        const store = await initStore();

        store.dispatch({
            type: recorderConfigActions.UPDATE,
            payload: this.config,
        });

        this.storesByWorkerId.set(workerId, store);

        return store;
    }

    private async getOrRegisterStore(workerId: string | null | undefined): Promise<Store> {
        if (workerId === null || workerId === undefined) {
            workerId = 'main';
        }

        if (this.storesByWorkerId.has(workerId)) {
            return this.storesByWorkerId.get(workerId) as Store;
        } else {
            const store = await this.createStore(workerId);

            this.storesByWorkerId.set(workerId, store);

            return store;
        }
    }

    private addDevtoolMessageListeners() {
        this.transport.on<IRecorderWebAppRegisterMessage>(WebApplicationDevtoolMessageType.register, (message) => {
            this.registerWebApplication(message);
        });
        this.transport.on<IRecorderWebAppRegisterMessage>(WebApplicationDevtoolMessageType.unregister, (message) => {
           this.unregisterWebApplication(message);
        });
    }

    private async registerWebApplication(message: IRecorderWebAppRegisterMessage) {
        let error = null;

        try {
            const store = await this.getOrRegisterStore(message.fromWorker);
            const id = message.messageData.id;
            const payload: IRecorderWebAppRegisterData = { id };

            store.subscribe(() => {
                this.logger.log(store.getState());
            });

            store.dispatch({
                type: recorderWebAppAction.REGISTER,
                payload,
            });
        } catch (e) {
            error = e;
        }

        this.transport.broadcastUniversally(WebApplicationDevtoolMessageType.registerComplete, {
            ...message,
            messageData: {
                ...message.messageData,
                error,
            },
        });
    }

    private async unregisterWebApplication(message: IRecorderWebAppRegisterMessage) {
        let error = null;

        try {
            const store = await this.getOrRegisterStore(message.fromWorker);
            const id = message.messageData.id;
            const payload: IRecorderWebAppRegisterData = { id };

            store.dispatch({
                type: recorderWebAppAction.UNREGISTER,
                payload,
            });
        } catch (e) {
            error = e;
        }

        this.transport.broadcastUniversally(WebApplicationDevtoolMessageType.unregisterComplete, {
            ...message,
            messageData: {
                ...message.messageData,
                error,
            },
        });
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

        try {
            this.httpServer = new RecorderHttpServer(
                config.host,
                config.httpPort,
                this.getHttpRouter(),
                this.getHttpStaticRouter(),
                this.storesByWorkerId,
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
