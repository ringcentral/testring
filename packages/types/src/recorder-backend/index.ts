import {
    IWebApplicationRegisterCompleteMessage,
    IWebApplicationRegisterMessage,
} from '../web-application';

interface IRecorderRoute {
    method: string;
    mask: string;
    windowProps?: {
        width: number;
        height: number;
        position: number;
    };
}

export interface IRecorderServerRoute extends IRecorderRoute {
    handler: string;
}

export interface IRecorderHttpRoute extends IRecorderRoute {
    handler: (...args: any[]) => Promise<void> | void;
    options?: any;
}

export interface IRecorderStaticRoutes {
    [key: string]: {
        rootPath: string;
        directory: string;
        options?: {};
    };
}

interface IRecorderServerBaseConfig {
    host: string;
    httpPort: number;
    wsPort: number;
}

export interface IRecorderRuntimeConfiguration extends IRecorderServerBaseConfig {
    extensionId: string;
}

export interface IRecorderServerConfig extends IRecorderServerBaseConfig {
    router: IRecorderServerRoute[];
    staticRoutes: IRecorderStaticRoutes;
}

export interface IRecorderServerController {
    init: () => Promise<void>;
    kill: () => Promise<void>;
}


export interface IServer {
    run: () => Promise<void>;
    stop: () => Promise<void>;
    getUrl: () => string;
}

export interface IRecorderServer {
    run: () => void;
    kill: () => Promise<void>;
    openBrowser: () => void;
}

export interface IWsMessage {
    conId: string;
    payload?: any;
}

export interface IRecorderProxyCleanedMessage {
    fromWorker: null | string;
    messageData: any;
}

export interface IRecorderProxyMessage extends IRecorderProxyCleanedMessage {
    messageType: string;
}

export interface IRecorderWebAppRegisterMessage extends IRecorderProxyCleanedMessage {
    messageData: IWebApplicationRegisterMessage;
}

export interface IRecorderWebAppRegisterCompleteMessage extends IRecorderProxyCleanedMessage {
    messageData: IWebApplicationRegisterCompleteMessage;
}
