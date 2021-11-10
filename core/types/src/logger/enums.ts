export const enum LogStepTypes {
    log = 'log',
    info = 'info',
    debug = 'debug',
    warning = 'warning',
    error = 'error',
    success = 'success',
}

export const enum LogTypes {
    log = 'log',
    info = 'info',
    warning = 'warning',
    error = 'error',
    debug = 'debug',
    step = 'step',
    screenshot = 'screenshot',
    file = 'file',
    media = 'media',
    success = 'success',
}

export const enum LogLevel {
    verbose = 'verbose',
    debug = 'debug',
    info = 'info',
    warning = 'warning',
    error = 'error',
    silent = 'silent',
}

export const enum LoggerMessageTypes {
    REPORT = 'logger/REPORT',
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
