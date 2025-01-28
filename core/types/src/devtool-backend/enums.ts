export const enum DevtoolWSServerEvents {
    CONNECTION = 'RecorderWSServerEvents/CONNECTION',
    ERROR = 'RecorderWSServerEvents/ERROR',
    MESSAGE = 'RecorderWSServerEvents/MESSAGE',
    CLOSE = 'RecorderWSServerEvents/CLOSE',
}

export const enum DevtoolWorkerMessages {
    START_SERVER = 'RecorderServerEvents/START_SERVER',
    START_SERVER_COMPLETE = 'RecorderServerEvents/START_SERVER_COMPLETE',
}

export const enum DevtoolProxyMessages {
    TO_WORKER = 'RecorderMessage/TO_WORKER',
    FROM_WORKER = 'RecorderMessage/FROM_WORKER',
}

export const enum DevtoolPluginHooks {
    beforeStart = 'beforeStart',
    afterStart = 'afterStart',
    beforeStop = 'beforeStop',
    afterStop = 'afterStop',
}
