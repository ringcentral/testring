/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import { Request } from '../src/interfaces';
import { TransportMock } from '@testring/test-utils';
import { HttpClientLocal } from '../src/http-client-local';
import { HttpMessageType } from '../src/structs';


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
        transport.on(HttpMessageType.send, (data: Request, src: string) => {
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
        transport.on(HttpMessageType.send, (data: Request, src: string) => {
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


