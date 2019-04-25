import {
    IDevtoolWSMessage,
    IServer,
    DevtoolEvents,
    DevtoolWSServerEvents,
} from '@testring/types';

import { EventEmitter } from 'events';
import { Server as WSS } from 'ws';
import * as WebSocket from 'ws';
import { generateUniqId } from '@testring/utils';
import { LoggerClient, loggerClient } from '@testring/logger';

export class DevtoolWsServer extends EventEmitter implements IServer {
    private connections: Map<string, WebSocket> = new Map();

    private logger: LoggerClient = loggerClient.withPrefix('[recorder-wss]');

    constructor(
        private hostName: string,
        private port: number,
    ) {
        super();
    }

    private server: WSS;

    public async run(): Promise<void> {
        await new Promise((resolve, reject) => {
            try {
                this.server = new WSS({
                    host: this.hostName,
                    port: this.port,
                }, resolve);
            } catch (e) {
                reject(e);
            }

            this.server.on('connection', (socket: WebSocket) => this.registerConnection(socket));
        });
    }

    private registerConnection(ws: WebSocket) {
        const connectionId = generateUniqId();
        this.connections.set(connectionId, ws);

        this.emit(DevtoolWSServerEvents.CONNECTION, {
            connectionId,
        });

        ws.on('message', (message: string) => {
            try {
                const { type, payload } = JSON.parse(message);

                const data: IDevtoolWSMessage = {
                    type,
                    payload,
                };

                this.emit(DevtoolWSServerEvents.MESSAGE, data, { connectionId });
            } catch (e) {
                this.emit(DevtoolWSServerEvents.ERROR, e, { connectionId });
                this.logger.warn(e);
            }
        });

        ws.on('close', () => {
            this.emit(DevtoolWSServerEvents.CLOSE, { connectionId });
            this.connections.delete(connectionId);
        });
    }

    public send(connectionId: string, type: DevtoolEvents, payload: object) {
        const connection = this.connections.get(connectionId);

        if (connection) {
            connection.send(JSON.stringify({
                type,
                payload,
            }));
        } else {
            throw Error(`Unknown connection id ${connectionId}`);
        }
    }

    public broadcast(eventType: DevtoolEvents, payload: object) {
        for (let [connectionId] of this.connections) {
            this.send(connectionId, eventType, payload);
        }
    }

    public async stop(): Promise<void> {
        if (!this.server) {
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.server.close((error) => {
                delete this.server;

                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    public getUrl(): string {
        return `ws://${this.hostName}:${this.port}`;
    }
}
