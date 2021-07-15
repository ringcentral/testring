import {
    ExtensionMessagingTransportEvents,
    ExtensionMessagingTransportTypes,
    IExtensionMessagingTransportMessage,
    IExtensionApplicationConfig,
} from '@testring/types';

import { ClientWsTransport } from '@testring/client-ws-transport';

import { BackgroundChromeServer } from './chrome-transport/chrome-server';
import { CSPController } from './csp-controller';

type resolveReadyCallback = (value?: any) => void;

export class BackgroundChromeController {
    private backgroundServer: BackgroundChromeServer;

    private waitForReadyPromise: Promise<void>;

    private resolveReadyStateCallback: null | resolveReadyCallback;

    private serverConfig: IExtensionApplicationConfig | null = null;

    private ws: ClientWsTransport;

    private CSPController: CSPController = new CSPController();

    constructor() {
        this.backgroundServer = new BackgroundChromeServer();

        this.isReady();

        this.registerInternalHandlers();
    }

    private registerInternalHandlers() {
        const handler = async (message: IExtensionMessagingTransportMessage, conId: string) => {
            try {
                switch (message.type) {
                    case ExtensionMessagingTransportTypes.WAIT_FOR_READY:
                        await this.waitForReadyHandler(message.payload, conId);
                        break;
                    case ExtensionMessagingTransportTypes.SET_EXTENSION_OPTIONS:
                        await this.setExtensionOptionsHandler(message.payload as IExtensionApplicationConfig, conId);
                        break;
                    default:
                        throw Error('Unknown message ' + message);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        };

        this.backgroundServer.on(ExtensionMessagingTransportEvents.MESSAGE, handler);
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

    private async initWebSocket(serverConfig: IExtensionApplicationConfig) {
        this.ws = new ClientWsTransport(serverConfig.host, serverConfig.wsPort);

        this.ws.connect();

        await this.ws.handshake(serverConfig.appId);
    }

    private async setExtensionOptionsHandler(configuration: IExtensionApplicationConfig, conId: string) {
        if (this.resolveReadyStateCallback) {
            this.serverConfig = configuration;

            this.CSPController.setConfig(this.serverConfig);

            await this.initWebSocket(this.serverConfig);

            this.resolveReadyStateCallback();

            this.resolveReadyStateCallback = null;
        } else {
            // eslint-disable-next-line no-console
            console.error('Options initialization is happening only one time');
        }
    }

    private async waitForReadyHandler(message, conId: string) {
        if (this.serverConfig === null) {
            await this.waitForReadyPromise;
        }

        await new Promise<void>((resolve) => {
            setImmediate(() => {
                this.backgroundServer.send(conId, {
                    type: ExtensionMessagingTransportTypes.IS_READY,
                    payload: this.serverConfig,
                });
            });

            resolve();
        });
    }
}
