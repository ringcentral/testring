import { ChildProcess } from 'child_process';

type RemoveHandlerFunction = () => void;

export type TransportMessageHandler<T = any> = (payload: T, source?: string) => void;

export type TransportSerializer = (v: any) => ITransportSerializedStruct;

export type TransportDeserializer = (struct: ITransportSerializedStruct) => any;

export const enum TransportInternalMessageType {
    messageResponse = '_messageResponse_'
}

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

export interface ITransportBroadcastMessage extends ITransportMessage {
}

export interface ITransport {

    getProcessesList(): Array<string>;

    send<T = any>(processID: string, messageType: string, payload: T): Promise<void>;

    broadcast<T = any>(messageType: string, payload: T): void;

    broadcastLocal<T = any>(messageType: string, payload: T): void;

    registerChildProcess(processID: string, childProcess: ChildProcess): void;

    on<T = any>(messageType: string, callback: TransportMessageHandler<T>): RemoveHandlerFunction;

    once<T = any>(messageType: string, callback: TransportMessageHandler<T>): RemoveHandlerFunction;

    onceFrom<T = any>(
        processID: string,
        messageType: string,
        callback: TransportMessageHandler<T>
    ): RemoveHandlerFunction;
}
