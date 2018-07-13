import * as EventEmitter from 'eventemitter3';
import { IMessagingTransportMessage, MessagingTransportEvents } from '@testring/types';

import Port = chrome.runtime.Port;

export class MessagingTransportClient extends EventEmitter {
    constructor() {
        super();

        setTimeout(() => {
            this.connect();
        }, 0);
    }

    private port: Port;

    private connect(): void {
        this.disconnect();

        const port = chrome.runtime.connect();

        port.onMessage.addListener((message) => {
            this.handleMessage(message);
        });

        port.onDisconnect.addListener(() => {
            this.handleDisconnect();
        });

        this.port = port;

        this.emit(MessagingTransportEvents.CONNECT);
    }

    private handleDisconnect() {
        delete this.port;

        this.emit(MessagingTransportEvents.DISCONNECT);
    }

    private disconnect(): void {
        if (this.port) {
            this.port.disconnect();
            this.handleDisconnect();
        }
    }

    private handleMessage(message: IMessagingTransportMessage): void {
        const { event, payload } = message;

        this.emit(
            event,
            payload,
        );
    }

    public send(message: IMessagingTransportMessage): void {
        this.port.postMessage(message);
    }
}
