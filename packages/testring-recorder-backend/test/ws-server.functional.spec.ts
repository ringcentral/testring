/// <reference types="mocha" />

import * as WebSocket from 'ws';
import * as chai from 'chai';

import { RecorderWebSocketServer, RecorderWsEvents } from '../src/ws-server';

describe('Recorder WebsSocket server', () => {
    it('should start ws server and emit event of connections', (callback) => {
        const server = new RecorderWebSocketServer('localhost', 8080);

        server.run().then(() => {
            server.on(RecorderWsEvents.CONNECTION, (ws) => {
                chai.expect(ws).to.be.instanceOf(WebSocket);

                server.stop();

                callback();
            });

            new WebSocket('ws://localhost:8080');
        });
    });
});
