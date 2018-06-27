export enum LogTypes {
    log = 'log',
    info = 'info',
    warning = 'warning',
    error = 'error',
    debug = 'debug',
}

export enum LogLevel {
    verbose,
    debug,
    info,
    warning,
    error,
    silent
}

export enum LoggerMessageTypes {
    REPORT = 'logger/REPORT',
}

export enum LogQueueStatus {
    EMPTY = 'EMPTY',
    RUNNING = 'RUNNING',
}
