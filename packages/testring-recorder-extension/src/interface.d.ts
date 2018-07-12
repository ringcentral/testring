import { ExtensionTransportEvents } from './structs';

export interface IExtensionTransportMessage {
    event: ExtensionTransportEvents;
    payload: any;
}
