import { Server as WSS } from 'ws';
import * as WebSocket from 'ws';
import { IServer, RecorderEvents } from '@testring/types';
import { generateUniqId } from '@testring/utils';

export class RecorderWSServer implements IServer {
    private connections: Map<string, WebSocket> = new Map();

    constructor(
        private hostName: string,
        private port: number,
    ) {
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

        ws.on('close', () => this.connections.delete(connectionId));
        this.handshakeSession(connectionId);
    }

    public send(connectionId: string, eventType: RecorderEvents, payload: object) {
        const connection = this.connections.get(connectionId);

        if (connection) {
            connection.send(JSON.stringify({
                event: eventType,
                payload,
            }));
        } else {
            throw Error(`Unknown connection id ${connectionId}`);
        }
    }

    public broadcast(eventType: RecorderEvents, payload: object) {
        for (let [connectionId] of this.connections) {
            this.send(connectionId, eventType, payload);
        }
    }

    private handshakeSession(connectionId: string) {
        this.send(connectionId, RecorderEvents.HANDSHAKE,{
            connectionId,
        });
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
