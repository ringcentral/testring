import { EventEmitter } from 'events';
import { ITransport } from '@testring/types';

export class TransportMock extends EventEmitter implements ITransport {

    public getProcessesList() {
        return [];
    }

    public registerChildProcess(processID, child) {}

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
}
