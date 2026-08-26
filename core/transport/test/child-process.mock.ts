import {EventEmitter} from 'events';
import {
    ITransportDirectMessage,
    TransportInternalMessageType,
} from '@testring/types';

class ChildProcessMock extends EventEmitter {
    private messages: ITransportDirectMessage[] = [];

    constructor(
        private options: {
            acknowledge?: boolean;
            sendError?: Error;
            throwError?: Error;
        } = {},
    ) {
        super();
    }

    send(message: ITransportDirectMessage, callback: (arg0: Error | null) => void) {
        if (this.options.throwError) {
            throw this.options.throwError;
        }

        this.messages.push(message);

        if (this.options.sendError) {
            callback(this.options.sendError);
            return false;
        }

        if (this.options.acknowledge !== false) {
            this.$acknowledge(message.uid);
        }

        callback(null);
        return undefined;
    }

    $acknowledge(uid = this.messages.at(-1)?.uid) {
        if (uid) {
            super.emit('message', {
                type: TransportInternalMessageType.messageResponse,
                payload: uid,
            });
        }
    }

    $exit() {
        this.emit('exit');
    }

    $messages() {
        return this.messages;
    }

    $triggerListener<T = any>(payload: T) {
        this.emit('message', payload);
    }
}

export {ChildProcessMock};
