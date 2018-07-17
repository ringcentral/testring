export const TEST_ELEMENT_IDENTIFIER = 'data-test-automation-id';

export const enum MessagingTransportEvents {
    CONNECT = 'ExtensionEvents/CONNECT',
    DISCONNECT = 'ExtensionEvents/DISCONNECT',
    MESSAGE = 'ExtensionEvents/MESSAGE',
    RECORDING_EVENT = 'ExtensionEvents/RECORDING_EVENT',
}

export const enum RecordingEventTypes {
    CLICK = 'RecordingEventTypes/CLICK',
}

export const enum ClientWsTransportEvents {
    OPEN = 'ClientWsTransportEvents/OPEN',
    CLOSE = 'ClientWsTransportEvents/CLOSE',
    ERROR = 'ClientWsTransportEvents/CLOSE',
    MESSAGE = 'ClientWsTransportEvents/MESSAGE',
}

export type ElementPath = Array<IElementPathNode>;

export interface IElementPathNode {
    id: string;
}

export interface IRecordingEvent {
    type: RecordingEventTypes;
    elementPath: ElementPath;
}

export interface IMessagingTransportMessage {
    event: MessagingTransportEvents;
    payload: any;
}
