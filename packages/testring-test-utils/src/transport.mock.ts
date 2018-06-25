import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

export class TransportMock extends EventEmitter {

    private processes: Map<string, ChildProcess> = new Map();

    public broadcast(messageType: string, payload: any) {
        this.emit(messageType, payload);
    }

    public broadcastLocal(messageType: string, payload: any) {
        this.emit(messageType, payload);
    }

    public send(src: string, messageType: string, payload: any) {
        this.emit(messageType, payload);
    }

    public on(messageType, callback): any {
        super.on(messageType, callback);

        return () => {
            this.removeListener(messageType, callback);
        };
    }

    public once(messageType, callback): any {
        super.on(messageType, callback);

        return () => {
            this.removeListener(messageType, callback);
        };
    }

    public registerChildProcess(processID: string, process: ChildProcess) {
        this.processes.set(processID, process);
    }
}
