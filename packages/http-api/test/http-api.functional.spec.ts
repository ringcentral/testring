/// <reference types="mocha" />

import * as chai from 'chai';
import {fork} from '@testring/child-process';
import {Transport} from '@testring/transport';
import {IHttpRequest, IHttpResponse, ITransport} from '@testring/types';
import request from 'request';
import {HttpServer} from '../src/http-server';

describe('HTTP transport functional test', () => {
    it('delivers HTTP errors, bounds lost replies, and ignores late replies', async () => {
        const transport = new Transport();
        const workerID = 'http-worker';
        const serverTransport = {
            on: (type: string, callback: (data: any, source?: string) => void) =>
                transport.on(type, (data, _source) => callback(data, workerID)),
            send: transport.send.bind(transport),
            broadcastLocal: transport.broadcastLocal.bind(transport),
        } as unknown as ITransport;
        const server = new HttpServer(
            serverTransport,
            (httpRequest: IHttpRequest): Promise<IHttpResponse> => {
                const pathname = new URL(httpRequest.url).pathname;
                if (pathname === '/error') {
                    const error: any = new Error('HTTP 400');
                    error.name = 'StatusCodeError';
                    error.statusCode = 400;
                    error.options = {jar: request.jar()};
                    error.response = {
                        statusCode: 400,
                        body: {message: 'invalid request'},
                    };
                    return Promise.reject(error);
                }
                if (pathname === '/slow') {
                    return new Promise((resolve) =>
                        setTimeout(
                            () =>
                                resolve({
                                    statusCode: 200,
                                    statusMessage: 'OK',
                                    body: 'late reply',
                                    headers: {},
                                    cookies: [],
                                }),
                            800,
                        ),
                    );
                }
                return Promise.resolve({
                    statusCode: 200,
                    statusMessage: 'OK',
                    body: pathname,
                    headers: {},
                    cookies: [],
                });
            },
        );
        const child = await fork('test/fixtures/http-transport-worker.ts');
        transport.registerChild(workerID, child);
        const response = new Promise<any>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error('child HTTP test did not finish')),
                10000,
            );
            child.on('message', (message: any) => {
                if (message?.type === 'http-test-result') {
                    clearTimeout(timer);
                    resolve(message);
                } else if (message?.type === 'http-test-error') {
                    clearTimeout(timer);
                    reject(new Error(message.message));
                }
            });
            child.once('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });

        try {
            const result = await response;
            chai.expect(result.requestError).to.include({
                name: 'StatusCodeError',
                statusCode: 400,
            });
            chai.expect(result.requestError.responseBody).to.deep.equal({
                message: 'invalid request',
            });
            chai.expect(result.firstSuccess).to.equal('/first-success');
            chai.expect(result.timeoutError).to.include({
                name: 'HTTP_RESPONSE_TIMEOUT',
                code: 'HTTP_RESPONSE_TIMEOUT',
            });
            chai.expect(result.timeoutError.uid).to.be.a('string');
            chai.expect(result.timeoutError.uid).not.to.equal('');
            chai.expect(result.timeoutError.message).to.include('GET https://example.test/slow');
            chai.expect(result.timeoutError.message).not.to.include('timeout-secret');
            chai.expect(result.timeoutError.message).not.to.include('password');
            chai.expect(result.secondSuccess).to.equal('/second-success');
        } finally {
            server.kill();
            child.kill();
        }
    });
});
