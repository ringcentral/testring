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

export const enum RecorderPlugins {
    beforeStart = 'beforeStart',
    afterStart = 'afterStart',
    beforeStop = 'beforeStop',
    afterStop = 'afterStop',
}
