import { Server as WSS } from 'ws';
import { IServer } from '@testring/types';

import { DEFAULT_HOST, DEFAULT_WS_PORT } from './constants';

export class RecorderWebsocketServer implements IServer {
    constructor(
        private host: string = DEFAULT_HOST,
        private port: number = DEFAULT_WS_PORT,
    ) {
    }

    private server: WSS;

    public run(): void {
        const wss = new WSS({
            host: this.host,
            port: this.port,
        });

        wss.on(
            'connection',
            (ws) => {
                console.log('connected'); // eslint-disable-line
            },
        );

        this.server = wss;
    }

    public stop(): void {
        if (this.server) {
            this.server.close();
        }
    }
}
