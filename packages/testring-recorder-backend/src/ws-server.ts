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

    public run(): void {
        const wss = new WSS({
            host: this.host,
            port: this.port,
        });

        wss.on('connection', (socket) => {
            this.emit(
                RecorderWsEvents.CONNECTION,
                socket,
            );
        });

        this.server = wss;
    }

    public stop(): void {
        if (this.server) {
            this.server.close();
        }
    }

    public getUrl(): string {
        return `ws://${this.host}:${this.port}`;
    }
}
