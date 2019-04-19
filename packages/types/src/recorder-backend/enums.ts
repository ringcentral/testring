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


export const enum RecorderWorkerMessages {
    START_SERVER = 'RecorderServerEvents/START_SERVER',
    START_SERVER_COMPLETE = 'RecorderServerEvents/START_SERVER_COMPLETE',
}

export const enum RecorderProxyMessages {
    TO_WORKER = 'RecorderMessage/TO_WORKER',
    FROM_WORKER = 'RecorderMessage/FROM_WORKER',
}

export const enum RecorderPlugins {
    beforeStart = 'beforeStart',
    afterStart = 'afterStart',
    beforeStop = 'beforeStop',
    afterStop = 'afterStop',
}
