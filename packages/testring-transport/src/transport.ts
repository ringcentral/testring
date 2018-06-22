import * as process from 'process';
import { ChildProcess } from 'child_process';
import { Callback, IDirectMessage } from '../interfaces';
import { DirectTransport } from './direct-transport';
import { BroadcastTransport } from './broadcast-transport';
import { EventEmitter } from 'events';

type RemoveHandlerFunction = () => void;

export class Transport {

    private emitter: EventEmitter = new EventEmitter();

    private directTransport: DirectTransport;

    private broadcastTransport: BroadcastTransport;

    constructor(rootProcess: NodeJS.Process = process) {
        const handler = this.triggerListeners.bind(this);

        this.directTransport = new DirectTransport(handler);

        this.broadcastTransport = new BroadcastTransport(handler, rootProcess);
    }

    public getProcessStdioConfig(): Array<any> {
        return [null, null, null, 'ipc'];
    }

    public getProcessesList(): Array<string> {
        return this.directTransport.getProcessesList();
    }

    public send<T = any>(processID: string, messageType: string, payload: T): Promise<void> {
        return this.directTransport.send(processID, messageType, payload);
    }

    public broadcast<T = any>(messageType: string, payload: T): void {
        this.broadcastTransport.broadcast(messageType, payload);
    }

    public broadcastLocal<T = any>(messageType: string, payload: T): void {
        this.broadcastTransport.broadcastLocal(messageType, payload);
    }

    public registerChildProcess(processID: string, childProcess: ChildProcess) {
        this.directTransport.registerChildProcess(processID, childProcess);
    }

    public on<T = any>(messageType: string, callback: Callback<T>): RemoveHandlerFunction {
        this.emitter.on(messageType, callback);

        return () => {
            this.emitter.removeListener(messageType, callback);
        };
    }

    public once<T = any>(messageType: string, callback: Callback<T>): RemoveHandlerFunction {
        this.emitter.once(messageType, callback);

        return () => {
            this.emitter.removeListener(messageType, callback);
        };
    }

    public onceFrom<T = any>(processID: string, messageType: string, callback: Callback<T>): RemoveHandlerFunction {
        const handler = (message, source) => {
            if (processID === source) {
                callback(message);
                this.emitter.removeListener(messageType, handler);
            }
        };

        this.emitter.on(messageType, handler);

        return () => {
            this.emitter.removeListener(messageType, handler);
        };
    }

    private triggerListeners(message: IDirectMessage, source?: string) {
        this.emitter.emit(message.type, message.payload, source);
    }
}
