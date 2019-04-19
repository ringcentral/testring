import {
    ExtensionMessagingTransportEvents,
    ExtensionMessagingTransportTypes,
    IExtensionMessagingTransportMessage,
    IExtensionServersConfiguration,
} from '@testring/types';

import { ClientWsTransport } from '@testring/client-ws-transport';

import { BackgroundChromeServer } from './chrome-transport/chrome-server';

type resolveReadyCallback = (value?: any) => void;

export class BackgroundChromeController {
    private backgroundServer: BackgroundChromeServer;

    private waitForReadyPromise: Promise<void>;

    private resolveReadyStateCallback: null | resolveReadyCallback;

    private serverConfig: IExtensionServersConfiguration | null = null;

    private ws: ClientWsTransport;

    constructor() {
        this.backgroundServer = new BackgroundChromeServer();

        this.isReady();
        this.handleMessages();
    }

    private handleMessages() {
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

    public isReady(): Promise<void> {
        if (this.waitForReadyPromise) {
            return this.waitForReadyPromise;
        }

        this.waitForReadyPromise = new Promise<void>((resolve) => {
            this.resolveReadyStateCallback = resolve;
        });

        return this.waitForReadyPromise;
    }

    private async initWebSocket(serverConfig: IExtensionServersConfiguration) {
        this.ws = new ClientWsTransport(serverConfig.host, serverConfig.wsPort);

        this.ws.connect();

        await this.ws.handshake(serverConfig.appId);
    }

    public async setExtensionOptionsHandler(configuration: IExtensionServersConfiguration, conId) {
        if (this.resolveReadyStateCallback) {
            this.serverConfig = configuration;

            await this.initWebSocket(this.serverConfig);

            this.resolveReadyStateCallback();

            this.resolveReadyStateCallback = null;
        } else {
            // eslint-disable-next-line no-console
            console.error('Options initialization is happening only one time');
        }
    }

    public async waitForReadyHandler(message, conId) {
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
