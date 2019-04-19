import {
    ExtensionMessagingTransportEvents,
    ExtensionMessagingTransportTypes,
    IExtensionMessagingTransportMessage,
    IExtensionServersConfiguration,
} from '@testring/types';

import { BackgroundChromeServer } from './chrome-transport/chrome-server';

type resolveReadyCallback = (value?: any) => void;

export class BackgroundChromeController {
    private backgroundServer: BackgroundChromeServer;

    private waitForReadyPromise: Promise<void>;

    private resolveReadyStateCallback: null | resolveReadyCallback;

    private serverConfig: IExtensionServersConfiguration | null = null;

    constructor() {
        this.backgroundServer = new BackgroundChromeServer();

        this.isReady();
        this.handleMessages();
    }

    handleMessages() {
        this.backgroundServer.on(
            ExtensionMessagingTransportEvents.MESSAGE,
            (message: IExtensionMessagingTransportMessage, conId: string) => {
                switch (message.type) {
                    case ExtensionMessagingTransportTypes.WAIT_FOR_READY:
                        this.waitForReadyHandler(message.payload, conId);
                        break;
                    case ExtensionMessagingTransportTypes.SET_EXTENSION_OPTIONS:
                        this.setExtensionOptionsHandler(message.payload, conId);
                        break;
                    default:
                        // eslint-disable-next-line no-console
                        console.error('Unknown message');
                }
            }
        );
    }

    isReady(): Promise<void> {
        if (this.waitForReadyPromise) {
            return this.waitForReadyPromise;
        }

        this.waitForReadyPromise = new Promise<void>((resolve) => {
            this.resolveReadyStateCallback = resolve;
        });

        return this.waitForReadyPromise;
    }

    async setExtensionOptionsHandler(configuration: IExtensionServersConfiguration, conId) {
        if (this.resolveReadyStateCallback) {
            this.serverConfig = configuration;
            this.resolveReadyStateCallback();
            this.resolveReadyStateCallback = null;
        } else {
            // eslint-disable-next-line no-console
            console.error('Options initialization is happening only one time');
        }
    }

    async waitForReadyHandler(message, conId) {
        if (this.serverConfig === null) {
            await this.waitForReadyPromise;
        }

        setImmediate(() => {
            this.backgroundServer.send(conId, {
                type: ExtensionMessagingTransportTypes.IS_READY,
                payload: this.serverConfig,
            });
        });
    }
}
