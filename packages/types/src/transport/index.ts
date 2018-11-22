import { EventEmitter } from 'events';
import * as net from 'net';
import { TransportMessageHandler} from './structs';

type RemoveHandlerFunction = () => void;

export interface ITransportChild extends EventEmitter {
    send(message: any, callback?: (error: Error) => void): boolean;
    kill(signal?: string): void;

    addListener(event: string, listener: (...args: any[]) => void): this;
    addListener(event: "close", listener: (code: number, signal: string) => void): this;
    addListener(event: "disconnect", listener: () => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    addListener(event: "exit", listener: (code: number, signal: string) => void): this;
    addListener(event: "message", listener: (message: any, sendHandle: net.Socket | net.Server) => void): this;

    emit(event: string | symbol, ...args: any[]): boolean;
    emit(event: "close", code: number, signal: string): boolean;
    emit(event: "disconnect"): boolean;
    emit(event: "error", err: Error): boolean;
    emit(event: "exit", code: number, signal: string): boolean;
    emit(event: "message", message: any, sendHandle: net.Socket | net.Server): boolean;

    on(event: string, listener: (...args: any[]) => void): this;
    on(event: "close", listener: (code: number, signal: string) => void): this;
    on(event: "disconnect", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "exit", listener: (code: number, signal: string) => void): this;
    on(event: "message", listener: (message: any, sendHandle: net.Socket | net.Server) => void): this;

    once(event: string, listener: (...args: any[]) => void): this;
    once(event: "close", listener: (code: number, signal: string) => void): this;
    once(event: "disconnect", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "exit", listener: (code: number, signal: string) => void): this;
    once(event: "message", listener: (message: any, sendHandle: net.Socket | net.Server) => void): this;

    prependListener(event: string, listener: (...args: any[]) => void): this;
    prependListener(event: "close", listener: (code: number, signal: string) => void): this;
    prependListener(event: "disconnect", listener: () => void): this;
    prependListener(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "exit", listener: (code: number, signal: string) => void): this;
    prependListener(event: "message", listener: (message: any, sendHandle: net.Socket | net.Server) => void): this;

    prependOnceListener(event: string, listener: (...args: any[]) => void): this;
    prependOnceListener(event: "close", listener: (code: number, signal: string) => void): this;
    prependOnceListener(event: "disconnect", listener: () => void): this;
    prependOnceListener(event: "error", listener: (err: Error) => void): this;
    prependOnceListener(event: "exit", listener: (code: number, signal: string) => void): this;
    prependOnceListener(event: "message", listener: (message: any, sendHandle: net.Socket | net.Server) => void): this;
}


export interface ITransport {

    getProcessesList(): Array<string>;

    send<T = any>(processID: string, messageType: string, payload: T): Promise<void>;

    broadcast<T = any>(messageType: string, payload: T): void;

    broadcastLocal<T = any>(messageType: string, payload: T): void;

    registerChild(processID: string, child: ITransportChild): void;

    on<T = any>(messageType: string, callback: TransportMessageHandler<T>): RemoveHandlerFunction;

    once<T = any>(messageType: string, callback: TransportMessageHandler<T>): RemoveHandlerFunction;

    onceFrom<T = any>(
        processID: string,
        messageType: string,
        callback: TransportMessageHandler<T>
    ): RemoveHandlerFunction;
}
