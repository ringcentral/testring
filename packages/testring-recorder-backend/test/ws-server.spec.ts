import * as WebSocket from 'ws';

import { RecorderWebsocketServer } from '../src/ws-server';

describe('Recorder WebsSocket server', () => {
    it('should serve over websockets', (callback) => {
        const server = new RecorderWebsocketServer('localhost', 8080);

        server.run();

        const ws = new WebSocket('ws://localhost:8080');

        ws.on('open', () => {
            callback();
        });

        setTimeout(() => {
            server.stop();
        }, 100);
    });
});
