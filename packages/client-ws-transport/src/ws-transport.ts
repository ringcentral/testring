// TODO (flops) rewrite needed
/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */
import {
    ClientWsTransportEvents,
    IClientWsTransport,
    IDevtoolWSHandshakeResponseMessage,
    DevtoolEvents,
} from '@testring/types';

import {EventEmitter} from 'events';
import {Queue} from '@testring/utils';

interface IQueuedMessage {
    type: DevtoolEvents;
    payload: any;
    resolve: () => any;
}

export class ClientWsTransport
    extends EventEmitter
    implements IClientWsTransport
{
    private url: string;

    constructor(
        host: string,
        port: number,
        private shouldReconnect: boolean = true,
    ) {
        super();
        this.url = this.getUrl(host, port);
    }

    private connection: WebSocket;

    private messagesQueue = new Queue<IQueuedMessage>();

    private getUrl(host: string, port: number) {
        return `ws://${host}:${port}`;
    }

    private resolveQueue() {
        const queuedMessage = this.messagesQueue.getFirstElement();

        if (queuedMessage && this.getConnectionStatus()) {
            const {type, payload, resolve} = queuedMessage;

            try {
                this.wsSend(type, payload);

                resolve();

                this.messagesQueue.shift();

                if (this.messagesQueue.length > 0) {
                    this.resolveQueue();
                }
            } catch (error) {
                console.warn(error); // eslint-disable-line
            }
        }
    }

    private openHandler(): void {
        this.emit(ClientWsTransportEvents.OPEN);

        this.resolveQueue();
    }

    private messageHandler(message: MessageEvent): void {
        const {data} = message;
        let jsonData: any;

        if (typeof data === 'string') {
            try {
                jsonData = JSON.parse(data);
            } catch (e) {
                jsonData = data;
            }
        } else {
            jsonData = data;
        }

        this.emit(ClientWsTransportEvents.MESSAGE, jsonData);
    }

    private closeHandler(): void {
        this.emit(ClientWsTransportEvents.CLOSE);
    }

    private errorHandler(e): void {
        this.emit(ClientWsTransportEvents.ERROR, e);

        if (this.shouldReconnect) {
            this.reconnect();
        }
    }

    private wsSend(type: DevtoolEvents, payload: any): void {
        if (!this.getConnectionStatus()) {
            throw new Error('WebSocket connection not OPEN');
        }

        this.connection.send(JSON.stringify({type, payload}));
    }

    public connect(url: string = this.url): void {
        this.disconnect();

        const connection = new WebSocket(url);

        connection.onopen = () => this.openHandler();
        connection.onmessage = (message) => this.messageHandler(message);
        connection.onclose = () => this.closeHandler();
        connection.onerror = (e) => this.errorHandler(e);

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

    public getConnectionStatus() {
        return this.connection && this.connection.readyState === 1;
    }

    public async handshake(appId: string) {
        return new Promise<void>((resolve, reject) => {
            const handler = (data: IDevtoolWSHandshakeResponseMessage) => {
                if (data.type === DevtoolEvents.HANDSHAKE_RESPONSE) {
                    this.off(ClientWsTransportEvents.MESSAGE, handler);

                    if (typeof data.payload.error === 'string') {
                        reject(new Error(data.payload.error));
                    } else {
                        resolve();
                    }
                }
            };

            this.on(ClientWsTransportEvents.MESSAGE, handler);

            this.send(DevtoolEvents.HANDSHAKE_REQUEST, {
                appId,
            });
        });
    }

    public send(type: DevtoolEvents, payload: any): Promise<void> {
        return new Promise((resolve) => {
            if (this.messagesQueue.length <= 0) {
                try {
                    this.wsSend(type, payload);

                    resolve();
                } catch (e) {
                    this.messagesQueue.push({type, payload, resolve});
                }
            } else {
                this.messagesQueue.push({type, payload, resolve});
            }
        });
    }
}
