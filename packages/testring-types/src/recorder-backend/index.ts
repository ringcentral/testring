export const enum RecorderServerEvents {
    CONNECTION = 'RecorderServerEvents/CONNECTION',
    MESSAGE = 'RecorderServerEvents/MESSAGE',
    CLOSE = 'RecorderServerEvents/CLOSE',
}

export const enum RecorderServerMessageTypes {
    CLOSE = 'RecorderServerMessageTypes/CLOSE',
    MESSAGE = 'RecorderServerMessageTypes/MESSAGE',
}

export interface IServer {
    run: () => void;

    stop: () => void;

    getUrl: () => string;
}

export interface IRecorderServer {
    run: () => void;

    stop: () => void;

    openBrowser: () => void;
}

export interface IWsMessage {
    conId: string;
    payload?: any;
}
