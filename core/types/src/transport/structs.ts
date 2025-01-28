export type TransportMessageHandler<T = any> = (
    payload: T,
    source?: string,
) => void;

export type TransportSerializer = (v: any) => ITransportSerializedStruct;

export type TransportDeserializer = (struct: ITransportSerializedStruct) => any;

export interface ITransportSerializedStruct {
    $key: string;

    [key: string]: any;
}

export interface ITransportMessage<T = any> {
    type: string;
    payload: T;
}

export interface ITransportDirectMessage extends ITransportMessage {
    uid: string;
}

export type ITransportBroadcastMessage = ITransportMessage;
