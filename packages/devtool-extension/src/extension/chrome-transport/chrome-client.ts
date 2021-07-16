import {EventEmitter} from 'events';
import {
    IExtensionMessagingTransportMessage,
    ExtensionMessagingTransportEvents,
    ExtensionMessagingTransportTypes,
    IExtensionApplicationConfig,
} from '@testring/types';

import Port = chrome.runtime.Port;

export class BackgroundChromeClient extends EventEmitter {
    private serverConfig: IExtensionApplicationConfig | null = null;

    constructor() {
        super();

        this.connect();
    }

    private port: Port | undefined;

    private connect(): void {
        this.disconnect();

        const port = chrome.runtime.connect();

        port.onMessage.addListener(
            (message: IExtensionMessagingTransportMessage) => {
                this.handleMessage(message);
            },
        );

        port.onDisconnect.addListener(() => {
            this.handleDisconnect();
        });

        this.port = port;

        this.emit(ExtensionMessagingTransportEvents.CONNECT);
    }

    private handleDisconnect(): void {
        delete this.port;

        this.emit(ExtensionMessagingTransportEvents.DISCONNECT);
    }

    private disconnect(): void {
        if (this.port) {
            this.port.disconnect();
            this.handleDisconnect();
        }
    }

    public send<T>(type: ExtensionMessagingTransportTypes, payload: T): void {
        if (this.port) {
            this.port.postMessage({
                type,
                payload,
            });
        } else {
            throw Error('No connection to send message to');
        }
    }

    private handleMessage(message: IExtensionMessagingTransportMessage): void {
        this.emit(ExtensionMessagingTransportEvents.MESSAGE, message);
    }

    public setConfig(config: IExtensionApplicationConfig): void {
        this.send(
            ExtensionMessagingTransportTypes.SET_EXTENSION_OPTIONS,
            config,
        );
    }

    public async waitForReady(): Promise<void> {
        return new Promise<void>((resolve) => {
            const handler = (message: IExtensionMessagingTransportMessage) => {
                if (
                    message.type === ExtensionMessagingTransportTypes.IS_READY
                ) {
                    this.serverConfig = message.payload;

                    this.off(
                        ExtensionMessagingTransportEvents.MESSAGE,
                        handler,
                    );

                    resolve();
                }
            };

            this.on(ExtensionMessagingTransportEvents.MESSAGE, handler);

            this.send<null>(
                ExtensionMessagingTransportTypes.WAIT_FOR_READY,
                null,
            );
        });
    }

    public getConfig(): IExtensionApplicationConfig {
        if (this.serverConfig === null) {
            throw Error(
                'Application is not ready, please use waitForReady method before call',
            );
        }

        return this.serverConfig;
    }
}
