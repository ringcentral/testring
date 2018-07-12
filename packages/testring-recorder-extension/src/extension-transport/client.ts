import * as EventEmitter from 'eventemitter3';

import { IExtensionTransportMessage } from '../interface';
import { ExtensionTransportEvents } from '../structs';

import Port = chrome.runtime.Port;

export class ExtensionTransportClient extends EventEmitter {
    constructor() {
        super();

        this.connect();
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

        this.emit(ExtensionTransportEvents.CONNECT);
    }

    private handleDisconnect() {
        delete this.port;

        this.emit(ExtensionTransportEvents.DISCONNECT);
    }

    private disconnect(): void {
        if (this.port) {
            this.port.disconnect();
            this.handleDisconnect();
        }
    }

    private handleMessage(message: IExtensionTransportMessage): void {
        const { event, payload } = message;

        this.emit(
            event,
            payload,
        );
    }

    public send(message: IExtensionTransportMessage): void {
        // if (this.port) {
        //     this.connect();
        // }

        this.port.postMessage(message);
    }
}
