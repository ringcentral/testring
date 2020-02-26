/// <reference types="mocha" />
/* eslint sonarjs/no-identical-functions: 0 */

import * as chai from 'chai';
import { HttpMessageType, HttpServerPlugins, IHttpRequest, IHttpRequestMessage, IHttpResponse } from '@testring/types';
import { TransportMock } from '@testring/test-utils';
import { HttpServer } from '../src/http-server';

// TODO (flops) add tests for cookies

describe('HttpServer', () => {
    describe('General', () => {
        it('Should get data from broadcast', (callback) => {
            const responseMock: IHttpResponse = {
                statusCode: 200,
                statusMessage: '',
                body: null,
                headers: {},
                cookies: [],
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
                request: {},
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
                request: null,
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
                request: {},
            });
        });
    });

    describe('Hooks', () => {
        it('beforeRequest', (done) => {
            const responseMock: IHttpResponse = {
                statusCode: 200,
                statusMessage: '',
                body: null,
                headers: {},
                cookies: [],
            };

            let receivedRequest;

            const mockBody = 'mock body from test';
            const requestHandler = (request) => {
                receivedRequest = request;
                return Promise.resolve(responseMock);
            };
            const transport = new TransportMock();
            const httpServer = new HttpServer(transport, requestHandler);

            const testWriteHook = (request: IHttpRequest, data: IHttpRequestMessage): IHttpRequest => {
                const result = { ...request };
                result.body = mockBody;

                return result;
            };

            const hook = httpServer.getHook(HttpServerPlugins.beforeRequest);
            if (!hook) {
                done(new Error('Hook not found'));
                return;
            }

            hook.writeHook('test', testWriteHook);

            transport.on(HttpMessageType.reject, (error) => done(error));
            transport.on(HttpMessageType.response, (response) => {
                httpServer.kill();

                try {
                    chai.expect(receivedRequest.body).to.deep.equal(mockBody);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            transport.broadcast(HttpMessageType.send, {
                request: {},
                uid: 'test',
            });
        });

        it('beforeResponse', (done) => {
            const responseMock: IHttpResponse = {
                statusCode: 200,
                statusMessage: '',
                body: null,
                headers: {},
                cookies: [],
            };
            const mockRequest: IHttpRequest = {
                body: 'test',
                url: 'test',
            };
            const mockRequestData = { uid: 'test', request: mockRequest };

            const mockHeaders = { 'mocked': true };
            const requestHandler = () => Promise.resolve(responseMock);
            const transport = new TransportMock();
            const httpServer = new HttpServer(transport, requestHandler);

            const writeHook = (
                response: IHttpResponse,
                data: IHttpRequestMessage,
                request: IHttpRequest,
            ): IHttpResponse => {
                chai.expect(request).to.deep.equal(mockRequest);
                chai.expect(data).to.deep.equal(mockRequestData);

                return {
                    ...response,
                    headers: mockHeaders,
                };
            };

            const hook = httpServer.getHook(HttpServerPlugins.beforeResponse);
            if (!hook) {
                done(new Error('Hook not found'));
                return;
            }

            hook.writeHook('test', writeHook);

            transport.on(HttpMessageType.reject, (error) => done(error));
            transport.on(HttpMessageType.response, (response) => {
                httpServer.kill();

                try {
                    chai.expect(response.response.headers).to.deep.equal(mockHeaders);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            transport.broadcast(HttpMessageType.send, mockRequestData);
        });

        it('beforeError', (done) => {
            const transport = new TransportMock();
            const requestHandler = (): any => Promise.resolve();
            const httpServer = new HttpServer(transport, requestHandler);
            const mockErrorMessage = 'mock message';
            const mockRequest = {};
            const mockRequestData = { uid: 'test', request: mockRequest };

            transport.on(HttpMessageType.reject, (error) => {
                httpServer.kill();

                try {
                    chai.expect(error.error).to.be.instanceOf(Error);
                    chai.expect(error.error.message).to.equal(mockErrorMessage);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            const errorWriteHook = (error, data, request) => {
                chai.expect(data).to.deep.equal(mockRequestData);
                chai.expect(request).to.deep.equal(mockRequest);

                return new Error(mockErrorMessage);
            };

            const hook = httpServer.getHook(HttpServerPlugins.beforeError);
            if (!hook) {
                done(new Error('Hook not found'));
                return;
            }

            hook.writeHook('test', errorWriteHook);

            transport.broadcast(HttpMessageType.send, mockRequestData);
        });
    });
});
