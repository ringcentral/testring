import { MessagingTransportEvents } from './structs';

export interface IMessagingTransportMessage {
    event: MessagingTransportEvents;
    payload: any;
}
