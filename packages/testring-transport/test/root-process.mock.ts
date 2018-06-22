import { EventEmitter } from 'events';
import { IDirectMessage } from '../interfaces';

class RootProcessMock extends EventEmitter {

    private messageStack: Array<IDirectMessage> = [];

    send(message: IDirectMessage) {
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
