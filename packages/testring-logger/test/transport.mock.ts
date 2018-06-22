import { EventEmitter } from 'events';

export class TransportMock extends EventEmitter {
    public broadcast(messageType: string, payload: any): void {
        setImmediate(() => this.emit(messageType, payload));
    }
}
