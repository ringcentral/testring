import { EventEmitter } from 'events';
import { ITransport } from '@testring/types';
import { ChildProcess } from 'child_process';

export class TransportMock extends EventEmitter implements ITransport {


    private processes: Map<string, ChildProcess> = new Map();

    public getProcessStdioConfig() {
        return [];
    }

    public getProcessesList() {
        return [];
    }

    public broadcast(messageType: string, payload: any) {
        this.emit(messageType, payload);
    }

    public broadcastLocal(messageType: string, payload: any) {
        this.emit(messageType, payload);
    }

    public send(src: string, messageType: string, payload: any): Promise<void> {
        this.emit(messageType, payload);

        return Promise.resolve();
    }

    public on(messageType, callback): any {
        super.on(messageType, callback);

        return () => this.removeListener(messageType, callback);
    }

    public once(messageType, callback): any {
        super.on(messageType, callback);

        return () => this.removeListener(messageType, callback);
    }

    public onceFrom(processID, messageType, callback): any {
        const handler = (message, source) => {
            if (processID === source) {
                callback(message);
                this.removeListener(messageType, handler);
            }
        };

        super.on(messageType, handler);

        return () => this.removeListener(messageType, handler);
    }

    public registerChildProcess(processID: string, process: ChildProcess) {
        this.processes.set(processID, process);
    }
}
