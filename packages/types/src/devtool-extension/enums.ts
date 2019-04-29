export const enum DevtoolEvents {
    HANDSHAKE_REQUEST = 'DevtoolEvents/HANDSHAKE_REQUEST',
    HANDSHAKE_RESPONSE = 'DevtoolEvents/HANDSHAKE_RESPONSE',
    WORKER_ACTION = 'DevtoolEvents/WORKER_ACTION',
    STORE_STATE = 'DevtoolEvents/STORE_STATE',
    GET_STORE = 'DevtoolEvents/GET_STORE',
}

export const enum ExtensionMessagingTransportEvents {
    CONNECT = 'ExtensionEvents/CONNECT',
    DISCONNECT = 'ExtensionEvents/DISCONNECT',
    MESSAGE = 'ExtensionEvents/MESSAGE',
}

export const enum ExtensionMessagingTransportTypes {
    // Chrome background messages
    SET_EXTENSION_OPTIONS = 'ExtensionTypes/SET_EXTENSION_OPTIONS',
    WAIT_FOR_READY = 'ExtensionTypes/WAIT_FOR_READY',
    DISPATCH_ACTION = 'ExtensionTypes/DISPATCH_ACTION',

    // Chrome client messages
    IS_READY = 'ExtensionTypes/IS_READY',
}

export const enum ClientWsTransportEvents {
    OPEN = 'ClientWsTransportEvents/OPEN',
    CLOSE = 'ClientWsTransportEvents/CLOSE',
    ERROR = 'ClientWsTransportEvents/CLOSE',
    MESSAGE = 'ClientWsTransportEvents/MESSAGE',
}

export const enum ExtensionPostMessageTypes {
    CLEAR_HIGHLIGHTS = 'ExtensionPostMessageTypes/CLEAR_HIGHLIGHTS',
    ADD_XPATH_HIGHLIGHT = 'ExtensionPostMessageTypes/ADD_XPATH_HIGHLIGHT',
    REMOVE_XPATH_HIGHLIGHT = 'ExtensionPostMessageTypes/REMOVE_XPATH_HIGHLIGHT',
}
