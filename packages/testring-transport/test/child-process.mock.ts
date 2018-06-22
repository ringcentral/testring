import { EventEmitter } from 'events';
import { IDirectMessage } from '../interfaces';
import { InternalMessageType } from '../src/structs';

class ChildProcessMock extends EventEmitter {

    constructor(private shouldFail: boolean = false) {
        super();
    }

    send(message: IDirectMessage, callback) {

        if (this.shouldFail) {
            callback(new Error('Some error happened'));
            return false;
        }

        // sending response back
        super.emit('message', {
            type: InternalMessageType.messageResponse,
            payload: message.uid
        });

        callback(null);
    }
}

export { ChildProcessMock };
