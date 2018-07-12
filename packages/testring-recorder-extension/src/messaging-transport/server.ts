/// <reference types="chrome" />

import * as EventEmitter from 'eventemitter3';

import { IMessagingTransportMessage } from '../interface';
import { MessagingTransportEvents } from '../structs';

import Port = chrome.runtime.Port;

const nanoid = require('nanoid');

export class MessagingTransportServer extends EventEmitter {
    constructor() {
        super();

        this.listenToConnections();
    }

    private connections: Map<string, Port> = new Map();

    private listenToConnections(): void {
        chrome.runtime.onConnect.addListener((port) => {
            this.registerConnection(port);
        });
    }

    private registerConnection(port: Port): void {
        const conId = nanoid();

        port.onMessage.addListener((message) => {
            this.handleMessage(message);
        });

        port.onDisconnect.addListener(() => {
            this.unregisterConnection(conId);
        });

        this.connections.set(conId, port);

        this.emit(
            MessagingTransportEvents.CONNECT,
            conId,
        );
    }

    private unregisterConnection(conId: string): void {
        this.connections.delete(conId);

        this.emit(
            MessagingTransportEvents.DISCONNECT,
            conId,
        );
    }

    private handleMessage(message: IMessagingTransportMessage): void {
        const { event, payload } = message;

        this.emit(
            event,
            payload,
        );
    }

    public disconnect(conId: string): void {
        const port = this.connections.get(conId);

        if (port) {
            port.disconnect();

            this.unregisterConnection(conId);
        }
    }

    public send(conId: string, message: IMessagingTransportMessage): void {
        const port = this.connections.get(conId);

        if (port) {
            port.postMessage(message);
        } else {
            throw new Error(`Connection with id ${conId} not found`);
        }
    }
}
