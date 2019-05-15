import {
    IWebApplicationRegisterCompleteMessage,
    IWebApplicationRegisterMessage,
} from '../web-application';
import { ITestControllerExecutionState } from '../test-worker/structs';
import { TestWorkerAction } from '../test-worker/enums';

import { DevtoolEvents } from '../devtool-extension/enums';

interface IDevtoolRoute {
    method: string;
    mask: string;
    windowProps?: {
        width: number;
        height: number;
        position: number;
    };
}

export interface IDevtoolServerRoute extends IDevtoolRoute {
    handler: string;
}

export type DevtoolHttpRouteHandler = (
    // @TODO maybe add import express and redux types?
    req: any,
    res: any,
    context: any,
    appId: string,
    options?: any,
) => Promise<void> | void;

export type DevtoolHttpContextResolver = (req: any, res: any) => Promise<{
    context: object;
    key: string;
}>;

export interface IDevtoolHttpRoute extends IDevtoolRoute {
    handler: DevtoolHttpRouteHandler;
    options?: any;
}

export interface IDevtoolStaticRoutes {
    [key: string]: {
        rootPath: string;
        directory: string;
        options?: {};
    };
}

interface IDevtoolServerBaseConfig {
    host: string;
    httpPort: number;
    wsPort: number;
}

export interface IDevtoolRuntimeConfiguration extends IDevtoolServerBaseConfig {
    extensionId: string;
}

export interface IDevtoolServerConfig extends IDevtoolServerBaseConfig {
    router: IDevtoolServerRoute[];
    staticRoutes: IDevtoolStaticRoutes;
}

export interface IDevtoolServerController {
    init: () => Promise<void>;
    kill: () => Promise<void>;
}

export interface IServer {
    run: () => Promise<void>;
    stop: () => Promise<void>;
    getUrl: () => string;
}

export interface IDevtoolProxyCleanedMessage {
    source: null | string;
    messageData: any;
}

export interface IDevtoolProxyMessage extends IDevtoolProxyCleanedMessage {
    messageType: string;
}

export interface IDevtoolWorkerRegisterMessage extends IDevtoolProxyCleanedMessage {
    messageData: ITestControllerExecutionState;
}

export interface IDevtoolWorkerUpdateStateMessage extends IDevtoolProxyCleanedMessage {
    messageData: ITestControllerExecutionState;
}

export interface IDevtoolWorkerUpdateDependenciesMessage extends IDevtoolProxyCleanedMessage {
}

export interface IDevtoolWebAppRegisterMessage extends IDevtoolProxyCleanedMessage {
    messageData: IWebApplicationRegisterMessage;
}

export interface IDevtoolWebAppRegisterCompleteMessage extends IDevtoolProxyCleanedMessage {
    messageData: IWebApplicationRegisterCompleteMessage;
}

export interface IDevtoolWSMeta {
    connectionId: string;
}

export interface IDevtoolWSHandshakeResponseMessage {
    type: DevtoolEvents.HANDSHAKE_RESPONSE;
    payload: {
        appId: string;
        connectionId: string;
        error: null | Error | string;
    };
}

export interface IDevtoolWSHandshakeRequestMessage {
    type: DevtoolEvents.HANDSHAKE_REQUEST;
    payload: {
        appId: string;
    };
}

export interface IDevtoolWSGetStoreStateMessage {
    type: DevtoolEvents.GET_STORE;
    payload: void;
}


export interface IDevtoolWSStoreStateMessage {
    type: DevtoolEvents.STORE_STATE;
    // @TODO put here store state
    payload: any;
}

export interface IDevtoolWSDiffStoreStateMessage {
    type: DevtoolEvents.STORE_STATE_DIFF;
    // @TODO put here store state
    payload: any;
}

export interface IDevtoolWSCallWorkerAction {
    type: DevtoolEvents.WORKER_ACTION;
    payload: {
        actionType: TestWorkerAction;
    };
}

export type IDevtoolWSMessage = IDevtoolWSHandshakeResponseMessage
    | IDevtoolWSHandshakeRequestMessage
    | IDevtoolWSGetStoreStateMessage
    | IDevtoolWSStoreStateMessage
    | IDevtoolWSDiffStoreStateMessage
    | IDevtoolWSCallWorkerAction;


