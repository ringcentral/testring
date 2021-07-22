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
        src: string,
        messageType: string,
        payload: T,
    ): Promise<void> {
        this.emit(messageType, payload);

        return Promise.resolve();
    }

    public on<T = any>(
        messageType: string,
        callback: (m: T, source?: string) => void,
    ): any {
        super.on(messageType, callback);

        return () => this.removeListener(messageType, callback);
    }

    // eslint-disable-next-line sonarjs/no-identical-functions
    public once<T = any>(
        messageType: string,
        callback: (m: T, source?: string) => void,
    ): any {
        super.on(messageType, callback);

        return () => this.removeListener(messageType, callback);
    }

    public onceFrom<T = any>(
        processID: string,
        messageType: string,
        callback: (m: T, source?: string) => void,
    ): any {
        const handler = (message, source) => {
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
