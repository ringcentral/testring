import * as path from 'path';
import * as opn from 'opn';
import { IRecorderServer } from '@testring/types';

import { DEFAULT_HOST, DEFAULT_HTTP_PORT, DEFAULT_WS_PORT } from './constants';
import { RecorderHttpServer } from './http-server';
import { RecorderWebsocketServer } from './ws-server';

export class RecorderServer implements IRecorderServer {
    constructor(
        private host: string = DEFAULT_HOST,
        private httpPort: number = DEFAULT_HTTP_PORT,
        private wsPort: number = DEFAULT_WS_PORT,
    ) {
    }

    private httpServer: RecorderHttpServer = new RecorderHttpServer(
        path.dirname(require.resolve('@testring/recorder-app')),
        path.resolve(__dirname, '../templates/'),
        this.host,
        this.httpPort,
        this.wsPort,
    );

    private wsServer: RecorderWebsocketServer = new RecorderWebsocketServer(
        this.host,
        this.wsPort,
    );

    public run(): void {
        this.wsServer.run();
        this.httpServer.run();
    }

    public stop(): void {
        this.wsServer.stop();
        this.httpServer.stop();
    }

    public openBrowser(): void {
        opn(`http://${this.host}:${this.httpPort}`);
    }
}
