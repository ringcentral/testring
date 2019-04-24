import {
    ExtensionMessagingTransportEvents,
    IExtensionMessagingTransportMessage,
} from '@testring/types';

import * as EventEmitter from 'events';
import { generateUniqId } from '@testring/utils';
import Port = chrome.runtime.Port;

export class BackgroundChromeServer extends EventEmitter {
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

    private registerConnection(port) {
        const conId = generateUniqId();

        port.onMessage.addListener((message: IExtensionMessagingTransportMessage) => {
            this.handleMessage(message, conId);
        });

        port.onDisconnect.addListener(() => {
            this.unregisterConnection(conId);
        });

        this.connections.set(conId, port);

        this.emit(
            ExtensionMessagingTransportEvents.CONNECT,
            conId,
        );
    }

    private unregisterConnection(conId: string): void {
        this.connections.delete(conId);

        this.emit(
            ExtensionMessagingTransportEvents.DISCONNECT,
            conId,
        );
    }

    private handleMessage(message: IExtensionMessagingTransportMessage, conId: string) {
        this.emit(
            ExtensionMessagingTransportEvents.MESSAGE,
            message,
            conId
        );
    }

    public send(conId: string, message: IExtensionMessagingTransportMessage): void {
        const port = this.connections.get(conId);

        if (port) {
            port.postMessage(message);
        } else {
            throw new Error(`Connection with id ${conId} not found`);
        }
    }

    public broadcast(message: IExtensionMessagingTransportMessage) {
        for (let [conId] of this.connections) {
            this.send(conId, message);
        }
    }
}
