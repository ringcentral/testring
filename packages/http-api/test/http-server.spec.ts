/// <reference types="mocha" />
/* eslint sonarjs/no-identical-functions: 0 */

import * as chai from 'chai';
import {
    HttpMessageType,
    HttpServerPlugins,
    IHttpRequest,
    IHttpRequestMessage,
    IHttpResponse,
} from '@testring/types';
import {TransportMock} from '@testring/test-utils';
import {serialize} from '@testring/transport';
import {HttpServer} from '../src/http-server';

// TODO (flops) add tests for cookies

describe('HttpServer', () => {
    it('does not warn for rejected HTTP requests', async () => {
        const transport = new TransportMock();
        const server = new HttpServer(
            transport,
            () => Promise.reject(new Error('request failed')),
        );
        const warnings: any[] = [];
        (server as any).logger = {
            warn: (...args: any[]) => warnings.push(args),
            error: () => undefined,
            verbose: () => undefined,
        };
        const rejection = new Promise<any>((resolve) =>
            transport.on(HttpMessageType.reject, resolve),
        );
        transport.broadcast(HttpMessageType.send, {
            uid: 'rejected-request',
            request: {method: 'GET', url: 'https://example.com'},
        });

        const message = await rejection;
        server.kill();
        chai.expect(message.error.message).to.equal('request failed');
        chai.expect(warnings).to.have.lengthOf(0);
    });

    it('sends portable HTTP errors with safe response diagnostics', async () => {
        class RequestJar {}
        class RawResponse {}
        const error: any = new Error('HTTP 503');
        error.name = 'StatusCodeError';
        error.statusCode = 503;
        error.error = {message: 'unavailable', raw: new RawResponse()};
        error.options = {jar: new RequestJar(), auth: {password: 'secret'}};
        error.response = {
            statusCode: 503,
            body: {message: 'unavailable', raw: new RawResponse()},
        };

        const transport = new TransportMock();
        const server = new HttpServer(transport, () => Promise.reject(error));
        const rejection = new Promise<any>((resolve, reject) => {
            transport.on(HttpMessageType.reject, resolve);
            transport.on(HttpMessageType.response, () =>
                reject(new Error('unexpected response')),
            );
        });
        transport.broadcast(HttpMessageType.send, {
            uid: 'portable-error',
            request: {url: 'https://example.com'},
        });

        const message = await rejection;
        server.kill();
        chai.expect(message.error).instanceOf(Error);
        chai.expect(message.error.name).to.equal('StatusCodeError');
        chai.expect(message.error.statusCode).to.equal(503);
        chai.expect(message.error.responseBody).to.deep.equal({
            message: 'unavailable',
        });
        chai.expect(message.error).not.to.have.property('options');
        chai.expect(message.error).not.to.have.property('response');
        chai.expect(() => serialize(message)).not.to.throw();
    });

    it('logs delivery context and sends one minimal fallback rejection', async () => {
        class FailingTransport extends TransportMock {
            public rejectSends = 0;

            public override send<T = any>(
                source: string,
                messageType: string,
                payload: T,
            ): Promise<void> {
                if (
                    messageType === HttpMessageType.reject &&
                    this.rejectSends++ === 0
                ) {
                    return Promise.reject(
                        new TypeError('RequestJar values are not supported'),
                    );
                }
                return super.send(source, messageType, payload);
            }
        }

        const transport = new FailingTransport();
        const server = new HttpServer(
            transport,
            () => Promise.reject(new Error('request failed')),
        );
        const logs: any[] = [];
        (server as any).logger = {
            error: (...args: any[]) => logs.push(args),
            debug: () => undefined,
            verbose: () => undefined,
        };
        const rejection = new Promise<any>((resolve) =>
            transport.on(HttpMessageType.reject, resolve),
        );
        transport.broadcastFrom(
            HttpMessageType.send,
            {
                uid: 'delivery-uid',
                request: {
                    method: 'POST',
                    url: 'https://user:password@example.com/private?token=query-secret',
                    headers: {cookie: 'cookie-secret'},
                    body: 'body-secret',
                },
            },
            'worker-7',
        );

        const message = await rejection;
        server.kill();
        const serializedLogs = JSON.stringify(logs);
        chai.expect(transport.rejectSends).to.equal(2);
        chai.expect(message.uid).to.equal('delivery-uid');
        chai.expect(message.error.message).to.equal(
            'HTTP response could not be delivered',
        );
        chai.expect(serializedLogs).to.include('delivery-uid');
        chai.expect(serializedLogs).to.include('worker-7');
        chai.expect(serializedLogs).to.include('POST');
        chai.expect(serializedLogs).to.include('https://example.com/private');
        chai.expect(serializedLogs).to.include('reject');
        for (const secret of [
            'password',
            'query-secret',
            'cookie-secret',
            'body-secret',
        ]) {
            chai.expect(serializedLogs).not.to.include(secret);
        }
    });

    it('logs terminal delivery failure when fallback rejection also fails', async () => {
        class FailingTransport extends TransportMock {
            public override send(): Promise<void> {
                return Promise.reject(new TypeError('delivery failed'));
            }
        }
        const transport = new FailingTransport();
        const server = new HttpServer(
            transport,
            () => Promise.reject(new Error('request failed')),
        );
        const logs: any[] = [];
        (server as any).logger = {
            error: (...args: any[]) => logs.push(args),
            debug: () => undefined,
            verbose: () => undefined,
        };
        transport.broadcastFrom(
            HttpMessageType.send,
            {
                uid: 'terminal-uid',
                request: {method: 'GET', url: 'https://example.com'},
            },
            'worker-9',
        );

        await new Promise((resolve) => setImmediate(resolve));
        server.kill();
        chai.expect(JSON.stringify(logs)).to.include('terminal');
        chai.expect(JSON.stringify(logs)).to.include('terminal-uid');
        chai.expect(JSON.stringify(logs)).to.include('worker-9');
    });

    it('falls back to a rejection when a successful response cannot be delivered', async () => {
        class FailingTransport extends TransportMock {
            public override send<T = any>(
                source: string,
                messageType: string,
                payload: T,
            ): Promise<void> {
                if (messageType === HttpMessageType.response) {
                    return Promise.reject(new TypeError('delivery failed'));
                }
                return super.send(source, messageType, payload);
            }
        }
        const transport = new FailingTransport();
        const server = new HttpServer(transport, () =>
            Promise.resolve({
                statusCode: 200,
                statusMessage: 'OK',
                body: {},
                headers: {},
                cookies: [],
            }),
        );
        const logs: any[] = [];
        (server as any).logger = {
            error: (...args: any[]) => logs.push(args),
            debug: (...args: any[]) => logs.push(args),
            verbose: () => undefined,
        };
        const rejection = new Promise<any>((resolve) =>
            transport.on(HttpMessageType.reject, resolve),
        );
        transport.broadcastFrom(
            HttpMessageType.send,
            {
                uid: 'response-delivery-uid',
                request: {method: 'GET', url: 'https://example.com'},
            },
            'worker-10',
        );

        const message = await rejection;
        server.kill();
        chai.expect(message.error.message).to.equal(
            'HTTP response could not be delivered',
        );
        chai.expect(JSON.stringify(logs)).to.include('response-delivery-uid');
        chai.expect(JSON.stringify(logs)).to.include('"attempt":"response"');
        chai.expect(JSON.stringify(logs)).to.include('"phase":"send"');
        chai.expect(JSON.stringify(logs)).not.to.include('Request failed');
    });
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
                    chai.expect(
                        response.status < 400,
                        'Response error',
                    ).to.equal(true);
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

            let receivedRequest: IHttpRequest | undefined;

            const mockBody = 'mock body from test';
            const requestHandler = (request: IHttpRequest) => {
                receivedRequest = request;
                return Promise.resolve(responseMock);
            };
            const transport = new TransportMock();
            const httpServer = new HttpServer(transport, requestHandler);

            const testWriteHook = (
                request: IHttpRequest,
                _data: IHttpRequestMessage,
            ): IHttpRequest => {
                const result = {...request};
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
            transport.on(HttpMessageType.response, (_response) => {
                httpServer.kill();

                try {
                    chai.expect(receivedRequest?.body).to.deep.equal(mockBody);
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
            const mockRequestData = {uid: 'test', request: mockRequest};

            const mockHeaders = {mocked: true};
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
                    chai.expect(response.response.headers).to.deep.equal(
                        mockHeaders,
                    );
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
            const mockRequestData = {uid: 'test', request: mockRequest};

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

            const errorWriteHook = (_error: Error, data: IHttpRequestMessage, request: IHttpRequest) => {
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
