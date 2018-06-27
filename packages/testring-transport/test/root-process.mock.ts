import { EventEmitter } from 'events';
import { ITransportDirectMessage } from '@testring/types';

class RootProcessMock extends EventEmitter {

    private messageStack: Array<ITransportDirectMessage> = [];

    send(message: ITransportDirectMessage) {
        this.messageStack.push(message);
    }

    $callCount() {
        return this.messageStack.length;
    }

    $lastCall() {
        return this.messageStack[this.messageStack.length - 1];
    }
}

export { RootProcessMock };
