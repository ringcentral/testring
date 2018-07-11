import { EventEmitter } from 'events';
import { Server as WSS } from 'ws';
import { IServer } from '@testring/types';

import { DEFAULT_HOST, DEFAULT_WS_PORT } from './constants';

export const enum RecorderWsEvents {
    CONNECTION = 'CONNECTION'
}

export class RecorderWebSocketServer extends EventEmitter implements IServer {
    constructor(
        private host: string = DEFAULT_HOST,
        private port: number = DEFAULT_WS_PORT,
    ) {
        super();
    }

    private server: WSS;

    public run(): Promise<void> {
        return new Promise<void>((resolve) => {
            const wss = new WSS({
                host: this.host,
                port: this.port,
            }, resolve);

            wss.on('connection', (socket) => {
                this.emit(
                    RecorderWsEvents.CONNECTION,
                    socket,
                );
            });

            this.server = wss;
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
        return `ws://${this.host}:${this.port}`;
    }
}
