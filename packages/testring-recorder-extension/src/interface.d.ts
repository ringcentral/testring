import { MessagingTransportEvents, RecordingEventTypes } from './structs';

export interface IRecordingEvent {
    type: RecordingEventTypes;
    elementPath: string;
}

export interface IMessagingTransportMessage {
    event: MessagingTransportEvents;
    payload: any;
}
