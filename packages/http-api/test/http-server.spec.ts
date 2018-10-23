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
});
