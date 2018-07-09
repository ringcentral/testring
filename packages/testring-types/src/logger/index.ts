export const enum LogTypes {
    log = 'log',
    info = 'info',
    warning = 'warning',
    error = 'error',
    debug = 'debug',
    step = 'step',
    media = 'media',
}

export const enum LogLevel {
    verbose = 'verbose',
    debug = 'debug',
    info = 'info',
    warning = 'warning',
    error = 'error',
    silent = 'silent'
}

export const enum LoggerMessageTypes {
    REPORT = 'logger/REPORT',
    REPORT_BATCH = 'logger/REPORT_BATCH',
}

export const enum LogQueueStatus {
    EMPTY = 'EMPTY',
    RUNNING = 'RUNNING',
}

export const enum LoggerPlugins {
    beforeLog = 'beforeLog',
    onLog = 'onLog',
    onError = 'onError',
}

export interface ILogEntry {
    time: Date,
    type: LogTypes,
    logLevel: LogLevel,
    content: Array<any>,
    formattedMessage: string,
    stepUid?: string,
    parentStep: string | null,
    logEnvironment?: any,
}

export interface ILoggerServer {
    getQueueStatus(): LogQueueStatus
}

export interface ILoggerClient {
    log(...args): void

    info(...args): void

    warn(...args): void

    error(...args): void

    debug(...args): void

    step(message: string, callback: () => Promise<any> | any): Promise<any>

    startStep(message: string): void

    endStep(): void
}
