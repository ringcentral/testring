import * as path from 'path';
import * as WebSocket from 'ws';
import { launch, LaunchedChrome } from 'chrome-launcher';
import { loggerClient } from '@testring/logger';
import { transport } from '@testring/transport';
import { generateUniqId } from '@testring/utils';
import {
    RecorderServerEvents,
    RecorderServerMessageTypes,
    IRecorderServer,
    ITransport,
    IWsMessage,
    IExtensionConfig,
    RecorderEvents,
} from '@testring/types';
import {
    RECORDER_ELEMENT_IDENTIFIER,
    DEFAULT_RECORDER_HOST,
    DEFAULT_RECORDER_HTTP_PORT,
    DEFAULT_RECORDER_WS_PORT,
} from '@testring/constants';

import { RecorderHttpServer } from './http-server';
import { RecorderWebSocketServer, RecorderWsEvents } from './ws-server';

const extensionPath = path.dirname(require.resolve('@testring/recorder-extension'));
const frontendPath = path.dirname(require.resolve('@testring/recorder-frontend'));
const templatesPath = path.resolve(__dirname, '../templates/');

export class RecorderServer implements IRecorderServer {
    constructor(
        private host: string = DEFAULT_RECORDER_HOST,
        private httpPort: number = DEFAULT_RECORDER_HTTP_PORT,
        private wsPort: number = DEFAULT_RECORDER_WS_PORT,
        private transportInstance: ITransport = transport,
    ) {
        this.wsServer.on(
            RecorderWsEvents.CONNECTION,
            (ws) => {
                this.registerConnection(ws);
            }
        );

        this.transportInstance.on(
            RecorderServerMessageTypes.CLOSE,
            (message) => {
                this.handleClose(message);
            }
        );

        this.transportInstance.on(
            RecorderServerMessageTypes.MESSAGE,
            (message) => {
                this.handleMessage(message);
            }
        );

        this.transportInstance.on(
            RecorderServerMessageTypes.STOP,
            (message) => {
                this.handleClose(message);
            }
        );
    }

    private connections: Map<string, WebSocket> = new Map();

    private httpServer = new RecorderHttpServer(
        frontendPath,
        templatesPath,
        this.host,
        this.httpPort,
        this.wsPort,
    );

    private wsServer = new RecorderWebSocketServer(
        this.host,
        this.wsPort,
    );

    private registerConnection(ws: WebSocket): void {
        const conId = generateUniqId();

        this.connections.set(conId, ws);

        ws.on('message', (message: string) => {
            try {
                const { event, payload } = JSON.parse(message);

                if (event) {
                    this.transportInstance.broadcast(
                        event,
                        { conId, payload },
                    );
                } else {
                    throw new Error('event type not specified');
                }
            } catch (e) {
                loggerClient.warn(`[WS Server] ${e}`);
            }
        });

        ws.on('close', () => {
            this.unregisterConnection(conId);
        });

        this.send(
            conId,
            {
                event: RecorderEvents.HANDSHAKE,
                payload: {
                    connectionId: conId,
                    // TODO: get identifier from framework config
                    testElementAttribute: RECORDER_ELEMENT_IDENTIFIER,
                } as IExtensionConfig,
            }
        );

        this.transportInstance.broadcast(
            RecorderServerEvents.CONNECTION,
            { conId }
        );
    }

    private unregisterConnection(conId: string): void {
        this.connections.delete(conId);

        this.transportInstance.broadcast(
            RecorderServerEvents.CLOSE,
            { conId }
        );
    }

    private closeConnection(conId: string): void {
        try {
            const connection = this.getConnection(conId);

            connection.close();
        } catch (e) {
            loggerClient.warn(e);
        }
    }

    private getConnection(conId: string): WebSocket {
        const connection = this.connections.get(conId);

        if (!connection) {
            throw new Error(`Connection with id ${conId} is not registered`);
        }

        return connection;
    }

    private send(conId: string, message: any): void {
        const connection = this.getConnection(conId);

        connection.send(JSON.stringify(message));
    }

    private handleClose(message: IWsMessage): void {
        const { conId } = message;

        this.closeConnection(conId);
    }

    private handleMessage(message: IWsMessage): void {
        const { conId, payload } = message;

        this.send(conId, payload);
    }

    public async run(): Promise<void> {
        await this.wsServer.run();
        await this.httpServer.run();
    }

    public async stop(): Promise<void> {
        await this.wsServer.stop();
        await this.httpServer.stop();
    }

    public openBrowser(): Promise<LaunchedChrome> {
        return launch({
            enableExtensions: true,
            startingUrl: this.httpServer.getUrl(),
            chromeFlags: [
                `--load-extension=${extensionPath}`,
            ],
        });
    }
}
