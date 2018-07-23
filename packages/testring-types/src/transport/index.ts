import { ChildProcess } from 'child_process';
import { TransportMessageHandler } from './structs';

type RemoveHandlerFunction = () => void;

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
