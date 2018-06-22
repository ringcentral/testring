/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import { TransportMock } from '@testring/test-utils';
import { HttpServer } from '../src/http-server';
import { HttpMessageType } from '../src/structs';

describe('HttpServer', () => {
    it('Should get data from broadcast', (callback) => {
        const responseMock = {
            statusCode: 200
        };

        const rp = () => {
            return Promise.resolve(responseMock);
        };

        const transport = new TransportMock();

        new HttpServer(transport as any, {} as any, rp);

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
        const rp = () => {
            return Promise.resolve();
        };

        const transport = new TransportMock();

        new HttpServer(transport as any, {} as any, rp);

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
        const rp = () => {
            return Promise.resolve();
        };

        const transport = new TransportMock();

        new HttpServer(transport as any, {} as any, rp);

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
