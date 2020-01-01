import {
    TransportInternalMessageType,
    TransportMessageHandler,
    ITransportBroadcastMessage,
    ITransportDirectMessage,
} from '@testring/types';
import { deserialize, serialize } from './serialize';

class BroadcastTransport {
    constructor(
        private triggerListeners: TransportMessageHandler,
        private rootProcess: NodeJS.Process,
    ) {
        this.registerRootProcess();
    }

    /**
     * Sending message to all connected processes
     */
    public broadcast(type: string, payload: any): void {
        this.sendMessage({
            type,
            payload: serialize(payload),
        });
    }

    public broadcastLocal(type: string, payload: any) {
        this.triggerListeners({
            type,
            payload,
        });
    }

    private registerRootProcess() {
        this.rootProcess.on('message', (message) => this.handleRootProcessMessage(message));
    }

    private handleRootProcessMessage(message: ITransportDirectMessage) {
        // incorrect message filtering
        if (!message || typeof message.type !== 'string') {
            return;
        }

        let normalizedMessage = message;

        if (message.payload && typeof message.payload.$key === 'string') {
            normalizedMessage = {
                ...message,
                payload: deserialize(message.payload),
            };
        }

        this.triggerListeners(normalizedMessage);

        this.sendMessage({
            type: TransportInternalMessageType.messageResponse,
            payload: normalizedMessage.uid,
        });
    }

    private sendMessage(message: ITransportBroadcastMessage) {
        if (typeof this.rootProcess.send === 'function') {
            this.rootProcess.send(message);
        }
    }
}

export { BroadcastTransport };
