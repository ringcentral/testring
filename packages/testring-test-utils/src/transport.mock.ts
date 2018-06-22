import { EventEmitter } from 'events';

export class TransportMock extends EventEmitter {
    constructor() {
        super();
    }
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
}
