/// <reference types="mocha" />

import * as chai from 'chai';
import { TransportMock } from '@testring/test-utils';
import { IHttpRequestMessage, HttpMessageType } from '@testring/types';
import { HttpClientLocal } from '../src/http-client-local';


describe('HttpClientLocal', () => {
    it('should get an error if request is null', (callback) => {
        const transport = new TransportMock();
        const httpClient = new HttpClientLocal(transport);

        httpClient.post(null as any)
            .then(() => {
                callback('Request resolved');
            })
            .catch((error) => {
                chai.expect(error).instanceOf(Error);
                callback();
            })
            .catch(callback);
    });

    it('should get response from server', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClientLocal(transport);
        const response = {};
        //imitate a server
        transport.on(HttpMessageType.send, (data: IHttpRequestMessage, src: string) => {
            transport.send(src, HttpMessageType.response, {
                uid: data.uid,
                response
            });
        });
        const result = await httpClient.post({
            url: 'qweqwe'
        });
        chai.expect(result).equal(response);
    });
    it('should get an error if response has no uid', (callback) => {
        const transport = new TransportMock();
        const httpClient = new HttpClientLocal(transport);

        //imitate a server
        transport.on(HttpMessageType.send, (data: IHttpRequestMessage, src: string) => {
            transport.send(src, HttpMessageType.response, {});
        });
        httpClient.post({
            url: 'qweqwe'
        })
            .then(() => {
                callback('Request resolved somehow');
            })
            .catch((error) => {
                chai.expect(error).instanceOf(Error);
                callback();
            })
            .catch(callback);
    });
});


