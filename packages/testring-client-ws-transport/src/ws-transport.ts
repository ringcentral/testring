import { ClientWsTransportEvents, RecorderEvents } from '@testring/types';
import { EventEmitter } from 'eventemitter3';

export class ClientWsTransport extends EventEmitter {
    constructor(
        private url: string = 'ws://localhost:3001',
    ) {
        super();
    }

    private connection: WebSocket;

    private openHandler(): void {
        this.emit(
            ClientWsTransportEvents.OPEN
        );
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

    public connect(url: string = this.url): void {
        this.disconnect();

        const connection = new WebSocket(url);

        connection.onopen = () => this.openHandler();
        connection.onmessage = (message) => this.messageHandler(message);
        connection.onclose = () => this.closeHandler();

        this.connection = connection;
    }

    public disconnect(): void {
        if (this.connection) {
            this.connection.close();

            delete this.connection;
        }
    }

    // TODO: queue messages till ws connection established
    public async send(event: RecorderEvents, payload: any): Promise<void> {
        if (this.connection) {
            this.connection.send(JSON.stringify({ event, payload }));
        }
    }
}
