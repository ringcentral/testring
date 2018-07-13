/// <reference types="mocha" />

import * as chai from 'chai';
import { HttpMessageType } from '@testring/types';
import { TransportMock } from '@testring/test-utils';
import { HttpServer } from '../src/http-server';

const DEFAULT_CONFIG: any = { httpThrottle: 0 };

describe('HttpServer', () => {
    it('Should get data from broadcast', (callback) => {
        const responseMock = {
            statusCode: 200
        };

        const requestHandler = () => Promise.resolve(responseMock);
        const transport = new TransportMock();

        new HttpServer(transport, DEFAULT_CONFIG, requestHandler);

        transport.on(HttpMessageType.reject, (error) => {
            callback(error);
        });

        transport.on(HttpMessageType.response, (response) => {
            chai.expect(response.response).to.be.equal(responseMock);

            callback();
        });

        transport.broadcast(HttpMessageType.send, {
            uid: 'test',
            request: {}
        });
    });

    it('Should throw exception if data isn`t correct', (callback) => {
        const rp = () => Promise.resolve();

        const transport = new TransportMock();

        new HttpServer(transport, DEFAULT_CONFIG, rp);

        transport.on(HttpMessageType.reject, (response) => {
            chai.expect(response.error).to.be.instanceOf(Error);
            callback();
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

        new HttpServer(transport, DEFAULT_CONFIG, rp);

        transport.on(HttpMessageType.reject, (response) => {
            chai.expect(response.error).to.be.instanceOf(Error);
            callback();
        });

        transport.on(HttpMessageType.response, (response) => {
            if (response.status > 400) {
                callback('response error');
            }
            callback(`request complete somehow ${response}`);
        });

        transport.broadcast(HttpMessageType.send, {
            uid: 'test',
            request: {}
        });
    });
});
