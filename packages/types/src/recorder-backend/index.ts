export const enum RecorderServerEvents {
    CONNECTION = 'RecorderServerEvents/CONNECTION',
    MESSAGE = 'RecorderServerEvents/MESSAGE',
    CLOSE = 'RecorderServerEvents/CLOSE',
}

export const enum RecorderServerMessageTypes {
    STOP = 'RecorderServerMessageTypes/STOP',
    CLOSE = 'RecorderServerMessageTypes/CLOSE',
    MESSAGE = 'RecorderServerMessageTypes/MESSAGE',
}

export interface IServer {
    run: () => Promise<void>;
    stop: () => Promise<void>;
    getUrl: () => string;
}

export interface IRecorderServer {
    run: () => void;
    stop: () => Promise<void>;
    openBrowser: () => void;
}

export interface IWsMessage {
    conId: string;
    payload?: any;
}
