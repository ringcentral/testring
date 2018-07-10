/// <reference types="mocha" />

import * as request from 'request-promise';
import * as WebSocket from 'ws';
import * as chai from 'chai';

import { TransportMock } from '@testring/test-utils';
import { RecorderServerEvents, RecorderServerMessageTypes } from '@testring/types';

import { RecorderServer } from '../src/recorder-server';
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

        it('should broadcast MESSAGE over transport on incoming ws message', (callback) => {
            const payload = 'HELLO';

            const con = new WebSocket(wsUrl);

            con.on('open', () => {
                con.send(payload);
            });

            transport.on(
                RecorderServerEvents.MESSAGE,
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
                async ({ conId }) => {
                    transport.broadcast(
                        RecorderServerMessageTypes.MESSAGE,
                        {
                            conId: conId,
                            payload: payload,
                        }
                    );
                },
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
                    srv.stop();
                }
            );
        });
    });
});
