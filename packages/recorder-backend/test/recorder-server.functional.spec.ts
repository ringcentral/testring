/// <reference types="mocha" />

import * as request from 'request-promise';
import * as WebSocket from 'ws';
import * as chai from 'chai';
import { getAvailableFollowingPort } from '@testring/utils';
import { TransportMock } from '@testring/test-utils';
import { RecorderServerEvents, RecorderServerMessageTypes } from '@testring/types';
import { DEFAULT_RECORDER_HOST, DEFAULT_RECORDER_HTTP_PORT, DEFAULT_RECORDER_WS_PORT } from '@testring/constants';

import { RecorderServer } from '../src/recorder-server';

describe('Recorder server', () => {
    let srv: RecorderServer;
    let transport: TransportMock;
    let httpPort = DEFAULT_RECORDER_HTTP_PORT;
    let httpUrl = `http://${DEFAULT_RECORDER_HOST}:${DEFAULT_RECORDER_HTTP_PORT}`;
    let wsPort = DEFAULT_RECORDER_WS_PORT;
    let wsUrl = `ws://${DEFAULT_RECORDER_HOST}:${DEFAULT_RECORDER_WS_PORT}`;

    beforeEach(async () => {
        if (srv) {
            await srv.kill();
        }

        httpPort = await getAvailableFollowingPort(DEFAULT_RECORDER_HTTP_PORT, DEFAULT_RECORDER_HOST);
        wsPort = await getAvailableFollowingPort(DEFAULT_RECORDER_WS_PORT, DEFAULT_RECORDER_HOST, [httpPort]);

        httpUrl = `http://${DEFAULT_RECORDER_HOST}:${httpPort}`;
        wsUrl = `ws://${DEFAULT_RECORDER_HOST}:${wsPort}`;

        transport = new TransportMock();

        srv = new RecorderServer(
            DEFAULT_RECORDER_HOST,
            httpPort,
            wsPort,
            transport,
        );

        await srv.run();
    });

    it('should serve http when run', async () => {
        await request(httpUrl);
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
                    await srv.kill();
                }
            );
        });
    });
});
