import { ClientWsTransportEvents, RecorderEvents } from '@testring/types';
import { EventEmitter } from 'eventemitter3';

interface IQueuedMessage {
    event: RecorderEvents;
    payload: any;
    resolve: () => any;
}

export class ClientWsTransport extends EventEmitter {
    constructor(
        private url: string = 'ws://localhost:3001',
    ) {
        super();
    }

    private connection: WebSocket;

    private messagesQueue: Array<IQueuedMessage> = [];

    private getConnectionStatus() {
        return this.connection && this.connection.readyState === 1;
    }

    private resolveQueue() {
        const queuedMessage = this.messagesQueue[0];

        if (queuedMessage && this.getConnectionStatus()) {
            const { event, payload, resolve } = queuedMessage;

            try {
                this.wsSend(event, payload);

                resolve();

                this.messagesQueue.shift();

                if (this.messagesQueue.length > 0) {
                    this.resolveQueue();
                }
            } catch (e) {
                console.warn(e); // eslint-disable-line
            }
        }
    }

    private openHandler(): void {
        this.emit(
            ClientWsTransportEvents.OPEN
        );

        this.resolveQueue();
    }

    private messageHandler(message: any): void {
        this.emit(
            ClientWsTransportEvents.MESSAGE,
            message,
        );
    }

    private closeHandler(): void {
        this.emit(
            ClientWsTransportEvents.CLOSE
        );
    }

    private wsSend(event: RecorderEvents, payload: any): void {
        if (!this.getConnectionStatus()) {
            throw new Error('WebSocket connection not OPEN');
        }

        this.connection.send(JSON.stringify({ event, payload }));
    }

    public connect(url: string = this.url): void {
        this.disconnect();

        const connection = new WebSocket(url);

        connection.onopen = () => this.openHandler();
        connection.onmessage = (message) => this.messageHandler(message);
        connection.onclose = () => this.closeHandler();

        this.connection = connection;
    }

    public reconnect() {
        if (this.connection) {
            this.connect(this.connection.url);
        }
    }

    public disconnect(): void {
        if (this.connection) {
            this.connection.close();
        }
    }

    public send(event: RecorderEvents, payload: any): Promise<void> {
        return new Promise((resolve) => {
            if (this.messagesQueue.length <= 0) {
                try {
                    this.wsSend(event, payload);

                    resolve();
                } catch (e) {
                    this.messagesQueue.push({ event, payload, resolve });
                }
            } else {
                this.messagesQueue.push({ event, payload, resolve });
            }
        });
    }
}
