export const enum RecorderServerEvents {
    CONNECTION = 'CONNECTION',
    MESSAGE = 'MESSAGE',
    CLOSE = 'CLOSE',
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
    type: RecorderServerEvents,
    conId: string,
    payload?: any,
}
