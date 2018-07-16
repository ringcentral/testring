import * as path from 'path';
import { exec } from 'child_process';
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

const extensionPath = path.dirname(require.resolve('@testring/recorder-extension'));
const frontendPath = path.dirname(require.resolve('@testring/recorder-frontend'));
const templatesPath = path.resolve(__dirname, '../templates/');

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
        const conId = nanoid();

        this.connections.set(conId, ws);

        ws.on('message', (message: string) => {
            const { event, payload } = JSON.parse(message);

            this.transportInstance.broadcast(
                event,
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

    public async run(): Promise<void> {
        await this.wsServer.run();
        await this.httpServer.run();
    }

    public async stop(): Promise<void> {
        await this.wsServer.stop();
        await this.httpServer.stop();
    }

    public openBrowser(): void {
        const browserDir = path.resolve(__dirname, `../temp/chromeUser/rcExt${nanoid()}`);

        const command = [
            'google-chrome',
            '--new-window',
            '--no-default-browser-check',
            `--load-extension="${extensionPath}"`,
            `--user-data-dir="${browserDir}"`,
            this.httpServer.getUrl()
        ];

        exec(command.join(' '));
    }
}
