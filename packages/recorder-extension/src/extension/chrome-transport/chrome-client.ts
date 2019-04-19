import * as EventEmitter from 'events';
import {
    IExtensionMessagingTransportMessage,
    ExtensionMessagingTransportEvents,
    ExtensionMessagingTransportTypes,
    IExtensionServersConfiguration,
} from '@testring/types';

import Port = chrome.runtime.Port;

export class BackgroundChromeClient extends EventEmitter {
    private serverConfig: IExtensionServersConfiguration | null = null;

    constructor() {
        super();

        this.connect();
    }

    private port: Port;

    private connect(): void {
        this.disconnect();

        const port = chrome.runtime.connect();

        port.onMessage.addListener((message: IExtensionMessagingTransportMessage) => {
            this.handleMessage(message);
        });

        port.onDisconnect.addListener(() => {
            this.handleDisconnect();
        });

        this.port = port;

        this.emit(ExtensionMessagingTransportEvents.CONNECT);
    }

    private handleDisconnect() {
        delete this.port;

        this.emit(ExtensionMessagingTransportEvents.DISCONNECT);
    }

    private disconnect(): void {
        if (this.port) {
            this.port.disconnect();
            this.handleDisconnect();
        }
    }

    public send(type: ExtensionMessagingTransportTypes, payload: any): void {
        this.port.postMessage({
            type,
            payload,
        });
    }

    private handleMessage(message: IExtensionMessagingTransportMessage) {
        this.emit(
            ExtensionMessagingTransportEvents.MESSAGE,
            message,
        );
    }

    public async setConfig(config: IExtensionServersConfiguration) {
        this.send(ExtensionMessagingTransportTypes.SET_EXTENSION_OPTIONS, config);
    }

    public async waitForReady() {
        return new Promise((resolve) => {
            const handler = (message: IExtensionMessagingTransportMessage) => {
                if (message.type === ExtensionMessagingTransportTypes.IS_READY) {
                    this.serverConfig = message.payload;

                    this.off(ExtensionMessagingTransportEvents.MESSAGE, handler);

                    resolve();
                }
            };

            this.on(ExtensionMessagingTransportEvents.MESSAGE, handler);
            this.send(ExtensionMessagingTransportTypes.WAIT_FOR_READY, {});
        });
    }

    public getConfig(): IExtensionServersConfiguration {
        if (this.serverConfig === null) {
            throw Error('Application is not ready, please use waitForReady method before call');
        }

        return this.serverConfig;
    }
}
