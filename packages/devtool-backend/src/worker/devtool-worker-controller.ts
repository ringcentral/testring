import {
    DevtoolEvents,
    DevtoolProxyMessages,
    DevtoolWorkerMessages,
    DevtoolWSServerEvents,
    IDevtoolHttpRoute,
    IDevtoolProxyCleanedMessage,
    IDevtoolProxyMessage,
    IDevtoolServerConfig,
    IDevtoolWebAppRegisterMessage,
    IDevtoolWorkerRegisterMessage,
    IDevtoolWorkerUpdateDependenciesMessage,
    IDevtoolWorkerUpdateStateMessage,
    IDevtoolWSMessage,
    IDevtoolWSMeta,
    ITestControllerExecutionState,
    ITransport,
    TestWorkerAction,
    WebApplicationDevtoolActions,
} from '@testring/types';
import { Request } from 'express-serve-static-core';

import { Store } from 'redux';
import { loggerClient } from '@testring/logger';
import {
    initStore,
    devtoolWebAppAction,
    IDevtoolWebAppRegisterData,
    devtoolConfigActions,
    devtoolWorkerStateActions,
    devtoolDependenciesActions,
} from '@testring/devtool-store';


import { DevtoolHttpServer } from './devtool-http-server';
import { DevtoolWsServer } from './devtool-ws-server';


export class DevtoolWorkerController {
    private logger = loggerClient.withPrefix('[recorder-worker]');

    private httpServer: DevtoolHttpServer;

    private wsServer: DevtoolWsServer;

    private storesByWorkerId: Map<string, Store> = new Map();
    private storesByWebAppId: Map<string, Store> = new Map();
    private workerIdByWebAppId: Map<string, string> = new Map();

    private webAppIdByConnectionId: Map<string, string> = new Map();
    private handlersByConnectionId: Map<string, () => void> = new Map();

    private config: IDevtoolServerConfig;

    constructor(private transport: ITransport) {
        this.transport.on(DevtoolWorkerMessages.START_SERVER, (config: IDevtoolServerConfig) => {
            this.init(config);
        });

        this.addDevtoolMessageListeners();

        process.once('exit', () => this.exitHandler);
    }

    private async createStore(workerId: string): Promise<Store> {
        const store = await initStore();

        store.dispatch({
            type: devtoolConfigActions.UPDATE,
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
        this.transport.on<IDevtoolProxyMessage>(DevtoolProxyMessages.TO_WORKER, async (message) => {
            try {
                await this.handleProxiedMessages(message);
            } catch (e) {
                this.logger.error(e);
            }
        });
    }

    private async handleProxiedMessages(message: IDevtoolProxyMessage) {
        const {
            messageType,
            ...rest
        } = message;

        switch (messageType) {
            case TestWorkerAction.register:
                await this.registerWorker(message as IDevtoolWorkerRegisterMessage);
                break;
            case TestWorkerAction.updateExecutionState:
                await this.updateExecutionState(message as IDevtoolWorkerUpdateStateMessage);
                break;
            case TestWorkerAction.updateDependencies:
                await this.updateDependencies(message as IDevtoolWorkerUpdateDependenciesMessage);
                break;
            case TestWorkerAction.unregister:
                await this.unregisterWorker(message as IDevtoolWorkerRegisterMessage);
                break;

            case WebApplicationDevtoolActions.register:
                await this.registerWebApplication(rest as IDevtoolWebAppRegisterMessage);
                break;
            case WebApplicationDevtoolActions.unregister:
                await this.unregisterWebApplication(rest as IDevtoolWebAppRegisterMessage);
                break;

            default:
                this.logger.warn(`Unknown message type ${messageType}`);
                break;
        }
    }

    private async sendProxiedMessage(messageType: string, message: IDevtoolProxyCleanedMessage) {
        this.transport.broadcastUniversally<IDevtoolProxyMessage>(DevtoolProxyMessages.FROM_WORKER, {
            ...message,
            messageType,
        });
    }

    private async sendToWorkerMessage(workerId: string, messageType: string, messageData: any) {
        const source = this.denormalizeWorkerId(workerId);

        this.transport.broadcastUniversally<IDevtoolProxyMessage>(DevtoolProxyMessages.FROM_WORKER, {
            messageData,
            source,
            messageType,
        });
    }

    private updateWorkerState(store: Store, payload: ITestControllerExecutionState) {
        store.dispatch({
            type: devtoolWorkerStateActions.UPDATE,
            payload,
        });
    }

    private async registerWorker(message: IDevtoolWorkerRegisterMessage) {
        const workerId = this.normalizeWorkerId(message.source);

        const store = await this.getOrRegisterStoreByWorkerId(workerId);

        this.updateWorkerState(store, message.messageData);
    }

    private async updateExecutionState(message: IDevtoolWorkerUpdateStateMessage) {
        const workerId = this.normalizeWorkerId(message.source);

        const store = await this.getOrRegisterStoreByWorkerId(workerId);

        this.updateWorkerState(store, message.messageData);
    }

    private async updateDependencies(message: IDevtoolWorkerUpdateDependenciesMessage) {
        const workerId = this.normalizeWorkerId(message.source);

        const store = await this.getOrRegisterStoreByWorkerId(workerId);

        store.dispatch({
            type: devtoolDependenciesActions.UPDATE,
            payload: message.messageData,
        });
    }

    private async unregisterWorker(message: IDevtoolWorkerRegisterMessage) {
        const workerId = this.normalizeWorkerId(message.source);
        const workerStore = this.storesByWorkerId.get(workerId);

        for (let [key, store] of this.storesByWebAppId) {
            if (workerStore === store) {
                this.storesByWebAppId.delete(key);
            }
        }

        for (let [webAppKey, workerMappedId] of this.workerIdByWebAppId) {
            if (workerMappedId === workerId) {
                this.workerIdByWebAppId.delete(webAppKey);
            }
        }

        this.storesByWorkerId.delete(workerId);
    }

    private async registerWebApplication(message: IDevtoolWebAppRegisterMessage) {
        let error = null;

        try {
            const workerId = this.normalizeWorkerId(message.source);
            const store = await this.getOrRegisterStoreByWorkerId(workerId);
            const id = message.messageData.id;
            await this.registerWebAppId(workerId, id);
            const payload: IDevtoolWebAppRegisterData = { id };

            this.logger.debug(`Register web app ${id}`);

            store.dispatch({
                type: devtoolWebAppAction.REGISTER,
                payload,
            });
        } catch (e) {
            error = e;
        }

        this.sendProxiedMessage(WebApplicationDevtoolActions.registerComplete, {
            ...message,
            messageData: {
                ...message.messageData,
                error,
            },
        });
    }

    private async unregisterWebApplication(message: IDevtoolWebAppRegisterMessage) {
        let error = null;

        try {
            const store = await this.getStoreByWorkerId(this.normalizeWorkerId(message.source));

            if (store) {
                const id = message.messageData.id;
                const payload: IDevtoolWebAppRegisterData = { id };

                await this.unregisterWebAppId(id);

                store.dispatch({
                    type: devtoolWebAppAction.UNREGISTER,
                    payload,
                });
            } else {
                throw Error('Worker is already unregistered');
            }
        } catch (e) {
            error = e;
        }

        const workerId = this.denormalizeWorkerId(message.source);

        this.sendProxiedMessage(WebApplicationDevtoolActions.unregisterComplete, {
            ...message,
            source: workerId,
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

    private getHttpRouter(): IDevtoolHttpRoute[] {
        return this.config.router.map(route => ({
            ...route,
            handler: this.loadHandler(route.handler),
        }));
    }

    private getHttpStaticRouter() {
        return this.config.staticRoutes;
    }

    async init(config: IDevtoolServerConfig) {
        this.logger.info('Starting recorder servers');
        this.config = config;

        try {
            await this.initHttpServer(config);
            await this.initWSServer(config);

            this.transport.broadcastUniversally(DevtoolWorkerMessages.START_SERVER_COMPLETE, null);
        } catch (err) {
            this.transport.broadcastUniversally(DevtoolWorkerMessages.START_SERVER_COMPLETE, err);
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

    async initHttpServer(config: IDevtoolServerConfig) {
        this.httpServer = new DevtoolHttpServer(
            config.host,
            config.httpPort,
            this.getHttpRouter(),
            this.getHttpStaticRouter(),
            (req) => this.httpContextResolver(req),
        );
        await this.httpServer.run();
        this.logger.debug(`Http server listening: ${this.httpServer.getUrl()}`);
    }

    async initWSServer(config: IDevtoolServerConfig) {
        this.wsServer = new DevtoolWsServer(
            config.host,
            config.wsPort,
        );
        await this.wsServer.run();

        this.wsServer.on(
            DevtoolWSServerEvents.MESSAGE,
            (data: IDevtoolWSMessage, meta: IDevtoolWSMeta) => this.WSSMessageHandler(data, meta),
        );
        this.wsServer.on(
            DevtoolWSServerEvents.CLOSE,
            (meta: IDevtoolWSMeta) => this.WSSDisconnectHandler(meta),
        );
        this.logger.debug(`WS server listening: ${this.wsServer.getUrl()}`);
    }

    private WSSDisconnectHandler(meta: IDevtoolWSMeta) {
        const { connectionId } = meta;
        const unsubscribe = this.handlersByConnectionId.get(connectionId);

        if (unsubscribe) {
            unsubscribe();
            this.handlersByConnectionId.delete(connectionId);
        }

        this.webAppIdByConnectionId.delete(connectionId);
    }

    private WSSMessageHandler(data: IDevtoolWSMessage, meta: IDevtoolWSMeta) {
        const { connectionId } = meta;

        switch (data.type) {
            case DevtoolEvents.HANDSHAKE_REQUEST: {
                const { appId } = data.payload;
                const payload = {
                    appId: data.payload.appId,
                    connectionId,
                    error: null,
                };
                this.webAppIdByConnectionId.set(connectionId, appId);

                const store = this.storesByWebAppId.get(appId);

                if (store) {
                    let previousState = store.getState();

                    const unsubscribe = store.subscribe(() => {
                        const currentState = store.getState();
                        const diffState = {};

                        for (let key in currentState) {
                            if (previousState[key] !== currentState[key]) {
                                diffState[key] = currentState[key];
                            }
                        }

                        this.wsServer.send(
                            connectionId,
                            DevtoolEvents.STORE_STATE_DIFF,
                            diffState,
                        );

                        previousState = currentState;
                    });
                    this.handlersByConnectionId.set(connectionId, unsubscribe);
                }

                this.wsServer.send(meta.connectionId, DevtoolEvents.HANDSHAKE_RESPONSE, payload);
                // @TODO make error handler
                break;
            }

            case DevtoolEvents.GET_STORE: {
                const appId = this.webAppIdByConnectionId.get(connectionId);
                const store = this.storesByWebAppId.get(appId as string);

                if (store) {
                    this.wsServer.send(
                        meta.connectionId,
                        DevtoolEvents.STORE_STATE,
                        store.getState(),
                    );
                } else {
                    // @TODO make error handler
                }
                break;
            }

            case DevtoolEvents.WORKER_ACTION: {
                const appId = this.webAppIdByConnectionId.get(connectionId);
                if (typeof appId === 'string') {
                    const workerId = this.workerIdByWebAppId.get(appId);
                    const actionType = data.payload.actionType;

                    if (workerId && actionType) {
                        this.sendToWorkerMessage(workerId, actionType, {});
                    }
                } else {
                    // @TODO make error handler
                }
                break;
            }
        }
    }

    private async exitHandler() {
        if (this.httpServer) {
            try {
                await this.httpServer.stop();
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(err);
            }
        }

        if (this.wsServer) {
            try {
                await this.wsServer.stop();
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(err);
            }
        }
    }
}
