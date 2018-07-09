import * as path from 'path';
import * as opn from 'opn';
import {RecorderServerEvents, IRecorderServer, ITransport, IWsMessage} from '@testring/types';
import * as WebSocket from 'ws';
import { transport } from '@testring/transport';

import { DEFAULT_HOST, DEFAULT_HTTP_PORT, DEFAULT_WS_PORT } from './constants';
import { RecorderHttpServer } from './http-server';
import { RecorderWebSocketServer, RecorderWsEvents } from './ws-server';

const nanoid = require('nanoid');

export const RECORDER_SERVER_MESSAGE = 'RECORDER_SERVER_MESSAGE';

export class RecorderServer implements IRecorderServer {
    constructor(
        private host: string = DEFAULT_HOST,
        private httpPort: number = DEFAULT_HTTP_PORT,
        private wsPort: number = DEFAULT_WS_PORT,
        private transportInstance: ITransport = transport,
    ) {
        this.wsServer.on(
            RecorderWsEvents.CONNECTION,
            (ws) => this.registerConnection(ws)
        );

        this.transportInstance.on(
            RECORDER_SERVER_MESSAGE,
            (message: IWsMessage) => {
                this.handleMessage(message);
            }
        );
    }

    private connections: Map<string, WebSocket> = new Map();

    private httpServer: RecorderHttpServer = new RecorderHttpServer(
        path.dirname(require.resolve('@testring/recorder-frontend')),
        path.resolve(__dirname, '../templates/'),
        this.host,
        this.httpPort,
        this.wsPort,
    );

    private wsServer: RecorderWebSocketServer = new RecorderWebSocketServer(
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

    private getConnection(conId: string): WebSocket {
        const connection = this.connections.get(conId);

        if (!connection) {
            throw new Error(`Connection with id ${conId} is not registered`);
        }

        return connection;
    }

    private send(conId: string, message: any) {
        const connection = this.getConnection(conId);

        connection.send(message);
    }

    private handleMessage(message: IWsMessage): void {
        const { conId, type, payload } = message;

        switch (type) {
            case RecorderServerEvents.CLOSE:
                this.unregisterConnection(conId);
                break;
            case RecorderServerEvents.MESSAGE:
                this.send(conId, payload);
                break;
        }
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
