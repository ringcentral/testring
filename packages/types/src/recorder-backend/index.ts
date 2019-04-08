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

export interface IRecorderServerConfig {
    host: string;
    httpPort: number;
    wsPort: number;
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

