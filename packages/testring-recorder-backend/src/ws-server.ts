import { EventEmitter } from 'events';
import { Server as WSS } from 'ws';
import { IServer } from '@testring/types';
import { DEFAULT_RECORDER_HOST, DEFAULT_RECORDER_WS_PORT } from '@testring/constants';

export const enum RecorderWsEvents {
    CONNECTION = 'CONNECTION'
}

export class RecorderWebSocketServer extends EventEmitter implements IServer {
    constructor(
        private host: string = DEFAULT_RECORDER_HOST,
        private port: number = DEFAULT_RECORDER_WS_PORT,
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
