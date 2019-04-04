export interface IRecorderServerRoute {
    url: string;
    method: string;
    handler: string;
    windowProps: {
        width: number;
        height: number;
        position: number;
    };
}

export interface IRecorderServerConfig {
    host: string;
    httpPort: number;
    wsPort: number;
    middlewares: string[];
    router: IRecorderServerRoute[];
    handlers: string[];
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

