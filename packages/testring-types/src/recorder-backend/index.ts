export interface IServer {
    run: () => void;

    stop: () => void;
}

export interface IRecorderServer extends IServer {
    openBrowser: () => void;
}
