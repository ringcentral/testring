import {EventEmitter} from 'events';
import {
    ITransportDirectMessage,
    TransportInternalMessageType,
} from '@testring/types';

class ChildProcessMock extends EventEmitter {
    constructor(private shouldFail: boolean = false) {
        super();
    }

    send(message: ITransportDirectMessage, callback: (arg0: Error | null) => void) {
        if (this.shouldFail) {
            callback(new Error('Some error happened'));
            return false;
        }

        // sending response back
        super.emit('message', {
            type: TransportInternalMessageType.messageResponse,
            payload: message.uid,
        });

        callback(null);
        return undefined;
    }

    $triggerListener<T = any>(payload: T) {
        this.emit('message', payload);
    }
}

export {ChildProcessMock};
