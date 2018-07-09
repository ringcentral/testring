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
