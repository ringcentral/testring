import * as request from 'request-promise';
import * as WebSocket from 'ws';
import * as chai from 'chai';

import { TransportMock } from '@testring/test-utils';
import { RecorderServerEvents } from '@testring/types';

import { RecorderServer, RECORDER_SERVER_MESSAGE } from '../src/recorder-server';
import { DEFAULT_HOST, DEFAULT_HTTP_PORT, DEFAULT_WS_PORT } from '../src/constants';

const httpUrl = `http://${DEFAULT_HOST}:${DEFAULT_HTTP_PORT}`;
const wsUrl = `ws://${DEFAULT_HOST}:${DEFAULT_WS_PORT}`;

describe('Recorder server', () => {
    let srv;
    let transport;

    beforeEach(() => {
        transport = new TransportMock();

        srv = new RecorderServer(
            DEFAULT_HOST,
            DEFAULT_HTTP_PORT,
            DEFAULT_WS_PORT,
            transport,
        );

        srv.run();
    });

    afterEach(() => {
        srv.stop();
    });

    it('should serve http when run', (callback) => {
        request(httpUrl).then(() => {
            callback();
        });
    });

    it('should serve ws when run', (callback) => {
        const con = new WebSocket(wsUrl);

        con.on('open', () => {
            con.close();

            callback();
        });
    });

    it('should broadcast CONNECTION over transport on new connection', (callback) => {
        new WebSocket(wsUrl);

        transport.on(
            RecorderServerEvents.CONNECTION,
            (message) => {
                chai.expect(message).to.have.property('conId');

                callback();
            }
        );
    });

    it('should broadcast MESSAGE over transport on incoming message', (callback) => {
        const payload = 'HELLO';

        const con = new WebSocket(wsUrl);

        con.on('open', () => {
            con.send(payload);
        });

        transport.on(
            RecorderServerEvents.MESSAGE,
            (message) => {
                chai.expect(message).to.have.property('conId');
                chai.expect(message).to.have.property('payload', payload);

                callback();
            }
        );
    });

    it('should broadcast CLOSE over transport on incoming message', (callback) => {
        const con = new WebSocket(wsUrl);

        con.on('open', () => {
            con.close();
        });

        transport.on(
            RecorderServerEvents.CLOSE,
            (message) => {
                chai.expect(message).to.have.property('conId');

                callback();
            }
        );
    });

    it('should send message received from transport over websocket', (callback) => {
        const payload = 'hello';
        const con = new WebSocket(wsUrl);

        con.on('message', (message) => {
            chai.expect(message).to.be.equal(payload);

            con.close();

            callback();
        });

        transport.on(
            RecorderServerEvents.CONNECTION,
            ({ conId }) => {
                transport.broadcastLocal(
                    RECORDER_SERVER_MESSAGE,
                    {
                        type: RecorderServerEvents.MESSAGE,
                        conId: conId,
                        payload: payload,
                    }
                );
            },
        );
    });
});
