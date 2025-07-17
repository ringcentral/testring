import {EventEmitter} from 'events';
import {ITransport, IWorkerEmitter} from '@testring/types';

export class TransportMock extends EventEmitter implements ITransport {
    private processes: Map<string, IWorkerEmitter> = new Map();

    public getProcessStdioConfig() {
        return [];
    }

    public getProcessesList() {
        return [];
    }

    public broadcast<T = any>(messageType: string, payload: T) {
        this.emit(messageType, payload);
    }

    public broadcastFrom<T = any>(
        messageType: string,
        payload: T,
        processID: string,
    ) {
        this.emit(messageType, payload, processID);
    }

    public broadcastLocal<T = any>(messageType: string, payload: T) {
        this.emit(messageType, payload);
    }

    public broadcastUniversally<T = any>(messageType: string, payload: T) {
        this.broadcast(messageType, payload);
    }

    public isChildProcess(): boolean {
        return true;
    }

    public send<T = any>(
        _src: string,
        messageType: string,
        payload: T,
    ): Promise<void> {
        this.emit(messageType, payload);

        return Promise.resolve();
    }

    public override on<T = any>(
        messageType: string,
        callback: (m: T, source?: string) => void,
    ): any {
        super.on(messageType, callback);

        return () => this.removeListener(messageType, callback);
    }

    public override once<T = any>(
        messageType: string,
        callback: (m: T, source?: string) => void,
    ): any {
        const wrappedCallback = (message: T, source?: string) => {
            this.removeListener(messageType, wrappedCallback);
            callback(message, source);
        };

        super.on(messageType, wrappedCallback);

        return () => this.removeListener(messageType, wrappedCallback);
    }

    public onceFrom<T = any>(
        processID: string,
        messageType: string,
        callback: (m: T, source?: string) => void,
    ): any {
        const handler = (message: T, source?: string) => {
            if (processID === source) {
                callback(message);
                this.removeListener(messageType, handler);
            }
        };

        super.on(messageType, handler);

        return () => this.removeListener(messageType, handler);
    }

    public registerChild(processID: string, process: IWorkerEmitter) {
        this.processes.set(processID, process);
    }
}
