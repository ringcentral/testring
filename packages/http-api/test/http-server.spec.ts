/// <reference types="mocha" />

import * as chai from 'chai';
import { HttpMessageType, IHttpResponse } from '@testring/types';
import { TransportMock } from '@testring/test-utils';
import { HttpServer } from '../src/http-server';

// TODO (flops) add tests for cookies and hooks

describe('HttpServer', () => {
    it('Should get data from broadcast', (callback) => {
        const responseMock: IHttpResponse = {
            statusCode: 200,
            statusMessage: '',
            body: null,
            headers: {},
            cookies: []
        };

        const requestHandler = () => Promise.resolve(responseMock);
        const transport = new TransportMock();
        const httpServer = new HttpServer(transport, requestHandler);

        transport.on(HttpMessageType.reject, (error) => {
            callback(error);
        });

        transport.on(HttpMessageType.response, (response) => {
            httpServer.kill();

            try {
                chai.expect(response.response).to.be.equal(responseMock);
                callback();
            } catch (err) {
                callback(err);
            }
        });

        transport.broadcast(HttpMessageType.send, {
            uid: 'test',
            request: {}
        });
    });

    it('Should throw exception if data isn`t correct', (callback) => {
        const rp = () => Promise.resolve();
        const transport = new TransportMock();

        const httpServer = new HttpServer(transport, rp as any);

        transport.on(HttpMessageType.reject, (response) => {
            httpServer.kill();

            try {
                chai.expect(response.error).to.be.instanceOf(Error);
                callback();
            } catch (err) {
                callback(err);
            }
        });

        transport.on(HttpMessageType.response, (response) => {
            callback(`request complete somehow ${response}`);
        });

        transport.broadcast(HttpMessageType.send, {
            uid: 'test',
            request: null
        });
    });

    it('Should throw exception if response isn`t correct', (callback) => {
        const rp = () => Promise.resolve();

        const transport = new TransportMock();

        const httpServer = new HttpServer(transport, rp as any);

        transport.on(HttpMessageType.reject, (response) => {
            httpServer.kill();

            try {
                chai.expect(response.error).to.be.instanceOf(Error);
                callback();
            } catch (err) {
                callback(err);
            }
        });

        transport.on(HttpMessageType.response, (response) => {
            try {
                chai.expect(response.status < 400, 'Response error').to.equal(true);
            } catch (err) {
                callback(err);
            }

            callback(`request complete somehow ${response}`);
        });

        transport.broadcast(HttpMessageType.send, {
            uid: 'test',
            request: {}
        });
    });

    it('Should finish queued requests', (callback) => {
        const responseMock: IHttpResponse = {
            statusCode: 200,
            statusMessage: '',
            body: null,
            headers: {},
            cookies: []
        };
        const transport = new TransportMock();


        const rp = (request) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    switch (request.url) {
                        case 'test1':
                            reject(new Error('rejected'));
                            break;
                        case 'test2':
                            resolve(responseMock);
                            break;
                        default:
                            callback('Invalid request call');
                    }
                }, 200);
            });
        };

        let responseID = 0;

        const spy = (...args) => {
            try {
                switch (responseID) {
                    case 0:
                        chai.expect(args[0].error).to.be.instanceOf(Error);
                        break;
                    case 1:
                        chai.expect(args[0].response).to.be.deep.equal(responseMock);

                        httpServer.kill();

                        callback();
                        break;
                    default:
                        throw new Error('Called to many times');
                }
            } catch (err) {
                httpServer.kill();
                callback(err);
            }

            responseID++;
        };

        const httpServer = new HttpServer(transport, rp as any);

        transport.on(HttpMessageType.response, spy);
        transport.on(HttpMessageType.reject, spy);

        transport.broadcast(HttpMessageType.send, {
            uid: 'uuid1',
            request: {
                url: 'test1',
            }
        });

        transport.broadcast(HttpMessageType.send, {
            uid: 'uuid2',
            request: {
                url: 'test2',
            }
        });
    });
});
