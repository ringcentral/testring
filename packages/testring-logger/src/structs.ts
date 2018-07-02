export enum LogTypes {
    log = 'log',
    info = 'info',
    warning = 'warning',
    error = 'error',
    debug = 'debug',
    step = 'step',
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
    REPORT_BATCH = 'logger/REPORT_BATCH',
}

export enum LogQueueStatus {
    EMPTY = 'EMPTY',
    RUNNING = 'RUNNING',
}
