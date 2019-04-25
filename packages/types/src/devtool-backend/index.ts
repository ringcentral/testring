import {
    IWebApplicationRegisterCompleteMessage,
    IWebApplicationRegisterMessage,
} from '../web-application';
import { ITestControllerExecutionState } from '../test-worker/structs';
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

export interface IDevtoolWebAppRegisterMessage extends IDevtoolProxyCleanedMessage {
    messageData: IWebApplicationRegisterMessage;
}

export interface IDevtoolWebAppRegisterCompleteMessage extends IDevtoolProxyCleanedMessage {
    messageData: IWebApplicationRegisterCompleteMessage;
}

export interface IDevtoolWSMeta {
    connectionId: string;
}

export interface IDevtoolWSMessage {
    type: DevtoolEvents;
    payload: any;
}

export interface IDevtoolWSHandshakeResponseMessage extends IDevtoolWSMessage {
    type: DevtoolEvents.HANDSHAKE_RESPONSE;
    payload: {
        appId: string;
        connectionId: string;
        error: null | Error;
    };
}
