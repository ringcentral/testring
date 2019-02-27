export type ElementSummary = {
    tagName: string;
    attributes: {[name: string]: string};
    innerText: string;
    value: string | undefined;
    children: ElementSummary[];
};

export const enum MessagingTransportEvents {
    CONNECT = 'ExtensionEvents/CONNECT',
    DISCONNECT = 'ExtensionEvents/DISCONNECT',
    MESSAGE = 'ExtensionEvents/MESSAGE',
    RECORDING_EVENT = 'ExtensionEvents/RECORDING_EVENT',
}

export const enum ClientWsTransportEvents {
    OPEN = 'ClientWsTransportEvents/OPEN',
    CLOSE = 'ClientWsTransportEvents/CLOSE',
    ERROR = 'ClientWsTransportEvents/CLOSE',
    MESSAGE = 'ClientWsTransportEvents/MESSAGE',
}

export interface IMessagingTransportMessage {
    event: string;
    payload: any;
}

export interface IExtensionConfig {
    connectionId: string;
    testElementAttribute: string;
}
