/// <reference types="mocha" />

import * as request from 'request-promise';
import * as WebSocket from 'ws';
import * as chai from 'chai';
import { getAvailablePort } from '@testring/test-utils';

import { TransportMock } from '@testring/test-utils';
import { RecorderServerEvents, RecorderServerMessageTypes } from '@testring/types';

import { RecorderServer } from '../src/recorder-server';
import { DEFAULT_HOST, DEFAULT_HTTP_PORT, DEFAULT_WS_PORT } from '../src/constants';

describe('Recorder server', () => {
    let srv: RecorderServer;
    let transport: TransportMock;
    let httpPort = DEFAULT_HTTP_PORT;
    let httpUrl = `http://${DEFAULT_HOST}:${DEFAULT_HTTP_PORT}`;
    let wsPort = DEFAULT_WS_PORT;
    let wsUrl = `ws://${DEFAULT_HOST}:${DEFAULT_WS_PORT}`;

    beforeEach(async () => {
        transport = new TransportMock();

        httpPort = await getAvailablePort(DEFAULT_HTTP_PORT, DEFAULT_HOST);
        httpUrl = `http://${DEFAULT_HOST}:${httpPort}`;
        wsPort = await getAvailablePort(DEFAULT_WS_PORT, DEFAULT_HOST, [httpPort]);
        wsUrl = `ws://${DEFAULT_HOST}:${wsPort}`;

        srv = new RecorderServer(
            DEFAULT_HOST,
            httpPort,
            wsPort,
            transport,
        );

        await srv.run();
    });

    afterEach(async () => {
        await srv.stop();
    });

    it('should serve http when run', (callback) => {
        request(httpUrl).then(() => {
            callback();
        });
    });

    context('WebSocket', () => {
        it('should serve ws when run', (callback) => {
            const con = new WebSocket(wsUrl);

            con.on('open', () => {
                con.close();

                callback();
            });
        });

        it('should broadcast CONNECTION over transport on new ws connection', (callback) => {
            new WebSocket(wsUrl);

            transport.on(
                RecorderServerEvents.CONNECTION,
                async (message) => {
                    chai.expect(message).to.have.property('conId');

                    callback();
                }
            );
        });

        it('should broadcast event over transport on incoming ws message', (callback) => {
            const event = 'GREETING';
            const payload = 'HELLO';

            const con = new WebSocket(wsUrl);

            con.on('open', () => {
                con.send(JSON.stringify({
                    event,
                    payload,
                }));
            });

            transport.on(
                event,
                async (message) => {
                    chai.expect(message).to.have.property('conId');
                    chai.expect(message).to.have.property('payload', payload);

                    con.close();

                    callback();
                }
            );
        });

        it('should broadcast CLOSE over transport when ws connection closed', (callback) => {
            const con = new WebSocket(wsUrl);

            con.on('open', () => {
                con.close();
            });

            transport.on(
                RecorderServerEvents.CLOSE,
                async (message) => {
                    chai.expect(message).to.have.property('conId');

                    callback();
                }
            );
        });

        it('should close connection when message of type CLOSE received over transport', (callback) => {
            const con = new WebSocket(wsUrl);

            con.on('close', () => {
                callback();
            });

            transport.on(
                RecorderServerEvents.CONNECTION,
                async ({ conId }) => {
                    transport.broadcast(
                        RecorderServerMessageTypes.CLOSE,
                        {
                            conId: conId,
                        }
                    );
                }
            );
        });

        it('should broadcast CLOSE message when message of type CLOSE received over transport', (callback) => {
            new WebSocket(wsUrl);

            transport.on(
                RecorderServerEvents.CLOSE,
                () => {
                    callback();
                }
            );

            transport.on(
                RecorderServerEvents.CONNECTION,
                async ({ conId }) => {
                    transport.broadcast(
                        RecorderServerMessageTypes.CLOSE,
                        {
                            conId: conId,
                        }
                    );
                }
            );
        });

        it('should close all connections when server stops', (callback) => {
            new WebSocket(wsUrl);

            transport.on(
                RecorderServerEvents.CLOSE,
                async () => {
                    callback();
                }
            );

            transport.on(
                RecorderServerEvents.CONNECTION,
                async () => {
                    await srv.stop();
                }
            );
        });
    });
});
