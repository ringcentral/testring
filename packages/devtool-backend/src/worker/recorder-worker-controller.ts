import {
    IRecorderHttpRoute,
    IRecorderProxyMessage,
    IRecorderServerConfig,
    IRecorderWebAppRegisterMessage,
    ITransport,
    IRecorderProxyCleanedMessage,
    RecorderProxyMessages,
    RecorderWorkerMessages,
    WebApplicationDevtoolMessageType,
    RecorderWSServerEvents,
    IRecorderWSMeta,
    RecorderEvents,
    IRecorderWSMessage,
} from '@testring/types';
import { Request } from 'express-serve-static-core';

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
    private storesByWebAppId: Map<string, Store> = new Map();
    private workerIdByWebAppId: Map<string, string> = new Map();
    private webAppIdByConnectionId: Map<string, string> = new Map();

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

    private denormalizeWorkerId(workerId: string | null): string | null {
        if (workerId === 'main') {
            return null;
        }

        return workerId;
    }

    private normalizeWorkerId(workerId: string | null | undefined): string {
        if (workerId === null || workerId === undefined) {
            workerId = 'main';
        }

        return workerId;
    }

    private async getStoreByWorkerId(workerId: string): Promise<Store | null> {
        workerId = this.normalizeWorkerId(workerId);

        if (this.storesByWorkerId.has(workerId)) {
            return this.storesByWorkerId.get(workerId) as Store;
        }

        return null;
    }

    private async getOrRegisterStoreByWorkerId(workerId: string): Promise<Store> {
        const store = await this.getStoreByWorkerId(workerId);

        if (store === null) {
            workerId = this.normalizeWorkerId(workerId);
            const createdStore = await this.createStore(workerId);

            this.storesByWorkerId.set(workerId, createdStore);

            return createdStore;
        }

        return store;
    }

    private async registerWebAppId(workerId: string, webAppId: string) {
        const store = await this.getStoreByWorkerId(workerId);

        if (store !== null && !this.storesByWebAppId.has(webAppId)) {
            this.workerIdByWebAppId.set(webAppId, workerId);
            this.storesByWebAppId.set(webAppId, store);
        } else {
            throw Error(`Error while registering web app with id ${webAppId}`);
        }
    }

    private async unregisterWebAppId(webAppId: string) {
        if (this.storesByWebAppId.has(webAppId)) {
            this.workerIdByWebAppId.delete(webAppId);
            this.storesByWebAppId.delete(webAppId);
        } else {
            throw Error(`Error while unregistering web app with id ${webAppId}`);
        }
    }

    private addDevtoolMessageListeners() {
        this.transport.on<IRecorderProxyMessage>(RecorderProxyMessages.TO_WORKER, async (message) => {
            try {
                await this.handleProxiedMessages(message);
            } catch (e) {
                this.logger.error(e);
            }
        });
    }

    private async handleProxiedMessages(message: IRecorderProxyMessage) {
        const {
            messageType,
            ...rest
        } = message;

        switch (messageType) {
            case WebApplicationDevtoolMessageType.register:
                await this.registerWebApplication(rest as IRecorderWebAppRegisterMessage);
                break;
            case WebApplicationDevtoolMessageType.unregister:
                await this.unregisterWebApplication(rest as IRecorderWebAppRegisterMessage);
                break;
            default:
                break;
        }
    }

    private async sendProxiedMessage(messageType: string, message: IRecorderProxyCleanedMessage) {
        this.transport.broadcastUniversally<IRecorderProxyMessage>(RecorderProxyMessages.FROM_WORKER, {
            ...message,
            messageType,
        });
    }

    private async sendToWorkerMessage(workerId: string, messageType: string, messageData: any) {
        const fromWorker = this.denormalizeWorkerId(workerId);

        this.transport.broadcastUniversally<IRecorderProxyMessage>(RecorderProxyMessages.FROM_WORKER, {
            messageData,
            fromWorker,
            messageType,
        });
    }

    private async registerWebApplication(message: IRecorderWebAppRegisterMessage) {
        let error = null;

        try {
            const workerId = this.normalizeWorkerId(message.fromWorker);
            const store = await this.getOrRegisterStoreByWorkerId(workerId);
            const id = message.messageData.id;
            await this.registerWebAppId(workerId, id);
            const payload: IRecorderWebAppRegisterData = { id };

            this.logger.debug(`Register web app ${id}`);

            store.dispatch({
                type: recorderWebAppAction.REGISTER,
                payload,
            });
        } catch (e) {
            error = e;
        }

        this.sendProxiedMessage(WebApplicationDevtoolMessageType.registerComplete, {
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
            const store = await this.getStoreByWorkerId(this.normalizeWorkerId(message.fromWorker));

            if (store) {
                const id = message.messageData.id;
                const payload: IRecorderWebAppRegisterData = { id };

                await this.unregisterWebAppId(id);

                store.dispatch({
                    type: recorderWebAppAction.UNREGISTER,
                    payload,
                });
            } else {
                throw Error('Worker is already unregistered');
            }
        } catch (e) {
            error = e;
        }

        const workerId = this.denormalizeWorkerId(message.fromWorker);

        this.sendProxiedMessage(WebApplicationDevtoolMessageType.unregisterComplete, {
            ...message,
            fromWorker: workerId,
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
            await this.initHttpServer(config);
            await this.initWSServer(config);

            this.transport.broadcastUniversally(RecorderWorkerMessages.START_SERVER_COMPLETE, null);
        } catch (err) {
            this.transport.broadcastUniversally(RecorderWorkerMessages.START_SERVER_COMPLETE, err);
        }
    }

    async httpContextResolver(req: Request): Promise<{ context: Store; key: string }> {
        const PARAM_KEY = 'appId';
        const webAppId = req.query[PARAM_KEY] || null;

        if (webAppId === null) {
            throw Error(`${PARAM_KEY} search query is required.`);
        }

        if (this.storesByWebAppId.has(webAppId)) {
            return {
                context: this.storesByWebAppId.get(webAppId) as Store,
                key: webAppId,
            };
        } else {
            throw Error(`Store id ${webAppId} is not found.`);
        }
    }

    async initHttpServer(config: IRecorderServerConfig) {
        this.httpServer = new RecorderHttpServer(
            config.host,
            config.httpPort,
            this.getHttpRouter(),
            this.getHttpStaticRouter(),
            (req) => this.httpContextResolver(req),
        );
        await this.httpServer.run();
        this.logger.debug(`Http server listening: ${this.httpServer.getUrl()}`);
    }

    async initWSServer(config: IRecorderServerConfig) {
        this.wsServer = new RecorderWSServer(
            config.host,
            config.wsPort,
        );
        await this.wsServer.run();

        this.wsServer.on(
            RecorderWSServerEvents.MESSAGE,
            (data: IRecorderWSMessage, meta: IRecorderWSMeta) => this.WSSMessageHandler(data, meta),
        );
        this.wsServer.on(
            RecorderWSServerEvents.CLOSE,
            (meta: IRecorderWSMeta) => this.WSSConnectionHandler(meta),
        );
        this.logger.debug(`WS server listening: ${this.wsServer.getUrl()}`);
    }

    private WSSConnectionHandler(meta: IRecorderWSMeta) {
        this.webAppIdByConnectionId.delete(meta.connectionId);
    }

    private WSSMessageHandler(data: IRecorderWSMessage, meta: IRecorderWSMeta) {
        const { connectionId } = meta;

        if (data.type === RecorderEvents.HANDSHAKE_REQUEST) {
            const { appId } = data.payload;
            const payload = {
                appId: data.payload.appId,
                connectionId,
                error: null,
            };
            this.webAppIdByConnectionId.set(connectionId, appId);

            this.wsServer.send(meta.connectionId, RecorderEvents.HANDSHAKE_RESPONSE, payload);
        }

        if (data.type === RecorderEvents.WORKER_ACTION) {
            const appId = this.webAppIdByConnectionId.get(connectionId);
            const workerId = this.workerIdByWebAppId.get(appId as string);
            const actionType = data.payload.actionType;

            if (workerId && actionType) {
                this.sendToWorkerMessage(workerId, actionType, {});
            }
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
