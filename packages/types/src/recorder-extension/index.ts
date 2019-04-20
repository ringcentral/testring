export type ElementSummary = {
    tagName: string;
    attributes: {[name: string]: string};
    innerText?: string;
    value?: string;
    children?: ElementSummary[];
};

export interface IExtensionNetworkConfig {
    httpPort: number;
    wsPort: number;
    host: string;
}

export interface IExtensionApplicationConfig extends IExtensionNetworkConfig {
    appId: string;
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

export interface IExtensionMessagingTransportMessage {
    type: ExtensionMessagingTransportTypes;
    payload: any;
}

