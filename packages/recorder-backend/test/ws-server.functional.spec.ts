/// <reference types="mocha" />

import * as WebSocket from 'ws';
import * as chai from 'chai';
import { getAvailablePort } from '@testring/test-utils';

import { RecorderWebSocketServer, RecorderWsEvents } from '../src/ws-server';

const host = 'localhost';

describe('Recorder WebsSocket server', () => {
    let port = 8080;

    beforeEach(async () => {
        port = await getAvailablePort(port, host);
    });

    it('should start ws server and emit event of connections', (callback) => {
        const server = new RecorderWebSocketServer('localhost', port);

        server.run().then(() => {
            server.on(RecorderWsEvents.CONNECTION, (ws) => {
                chai.expect(ws).to.be.instanceOf(WebSocket);

                server.stop();

                callback();
            });

            new WebSocket(`ws://${host}:${port}`);
        });
    });
});
