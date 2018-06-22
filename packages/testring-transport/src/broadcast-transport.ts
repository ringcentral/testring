import { Callback, IBroadcastMessage, IDirectMessage } from '../interfaces';
import { deserialize, serialize } from './serialize';
import { InternalMessageType } from './structs';

class BroadcastTransport {
    constructor(
        private triggerListeners: Callback,
        private rootProcess: NodeJS.Process
    ) {
        this.registerRootProcess();
    }

    /**
     * Sending message to all connected processes
     */
    public broadcast(type: string, payload: any): void {
        this.sendMessage({
            type,
            payload: serialize(payload)
        });
    }

    public broadcastLocal(type: string, payload: any) {
        this.triggerListeners({
            type,
            payload
        });
    }

    private registerRootProcess() {
        this.rootProcess.on('message', (message) => this.handleRootProcessMessage(message));
    }

    private handleRootProcessMessage(message: IDirectMessage) {
        // incorrect message filtering
        if (!message || typeof message.type !== 'string') {
            return;
        }

        let normalizedMessage = message;

        if (message.payload && typeof message.payload.$key === 'string') {
            normalizedMessage = {
                ...message,
                payload: deserialize(message.payload)
            };
        }

        this.triggerListeners(normalizedMessage);
        this.sendMessage({
            type: InternalMessageType.messageResponse,
            payload: normalizedMessage.uid
        });
    }

    private sendMessage(message: IBroadcastMessage) {
        if (typeof this.rootProcess.send === 'function') {
            this.rootProcess.send(message);
        }
    }
}

export { BroadcastTransport };
