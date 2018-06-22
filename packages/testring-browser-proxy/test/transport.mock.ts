import { EventEmitter } from 'events';

export class TransportMock extends EventEmitter {
    constructor() {
        super();
    }

    public broadcast(messageType: string, payload: any) {
        this.emit(messageType, payload);
    }
}
