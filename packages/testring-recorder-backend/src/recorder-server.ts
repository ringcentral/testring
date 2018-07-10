import * as path from 'path';
import * as opn from 'opn';
import * as WebSocket from 'ws';
import { loggerClientLocal } from '@testring/logger';
import { transport } from '@testring/transport';
import {
    RecorderServerEvents,
    RecorderServerMessageTypes,
    IRecorderServer,
    ITransport,
    IWsMessage,
} from '@testring/types';

import { DEFAULT_HOST, DEFAULT_HTTP_PORT, DEFAULT_WS_PORT } from './constants';
import { RecorderHttpServer } from './http-server';
import { RecorderWebSocketServer, RecorderWsEvents } from './ws-server';

const nanoid = require('nanoid');

export class RecorderServer implements IRecorderServer {
    constructor(
        private host: string = DEFAULT_HOST,
        private httpPort: number = DEFAULT_HTTP_PORT,
        private wsPort: number = DEFAULT_WS_PORT,
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
    }

    private connections: Map<string, WebSocket> = new Map();

    private httpServer = new RecorderHttpServer(
        path.dirname(require.resolve('@testring/recorder-frontend')),
        path.resolve(__dirname, '../templates/'),
        this.host,
        this.httpPort,
        this.wsPort,
    );

    private wsServer = new RecorderWebSocketServer(
        this.host,
        this.wsPort,
    );

    private registerConnection(ws: WebSocket): void {
        const conId = nanoid();

        this.connections.set(conId, ws);

        ws.on('message', (payload) => {
            this.transportInstance.broadcast(
                RecorderServerEvents.MESSAGE,
                { conId, payload },
            );
        });

        ws.on('close', () => {
            this.unregisterConnection(conId);
        });

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
            loggerClientLocal.warn(e);
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

        connection.send(message);
    }

    private handleClose(message: IWsMessage): void {
        const { conId } = message;

        this.closeConnection(conId);
    }

    private handleMessage(message: IWsMessage): void {
        const { conId, payload } = message;

        this.send(conId, payload);
    }

    public run(): void {
        this.wsServer.run();
        this.httpServer.run();
    }

    public stop(): void {
        this.wsServer.stop();
        this.httpServer.stop();
    }

    public openBrowser(): void {
        opn(this.httpServer.getUrl());
    }
}
