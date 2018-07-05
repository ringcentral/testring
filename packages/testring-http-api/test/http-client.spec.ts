/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import { Request } from '../src/interfaces';
import { TransportMock } from '@testring/test-utils';
import { HttpClient } from '../src/http-client';
import { HttpMessageType } from '../src/structs';

const DEFAULT_URL = 'test.com/invalid/test/url';

const imitateServer = (transport: TransportMock, response) => {
    transport.on(HttpMessageType.send, (data: Request, src: string) => {
        transport.send(src, HttpMessageType.response, {
            uid: data.uid,
            response
        });
    });
};

const imitateFailedServer = (transport: TransportMock, error: Error) => {
    transport.on(HttpMessageType.send, (data: Request, src: string) => {
        transport.send(src, HttpMessageType.reject, {
            uid: data.uid,
            error
        });
    });
};

describe('HttpClient', () => {
    it('should get an error if request is null', (callback) => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

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

    it('should get response from server (GET)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);
        const response = {};

        imitateServer(transport, response);

        const result = await httpClient.get({ url: DEFAULT_URL });

        chai.expect(result).equal(response);
    });

    it('should get response from server (POST)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);
        const response = {};

        imitateServer(transport, response);

        const result = await httpClient.post({ url: DEFAULT_URL });

        chai.expect(result).equal(response);
    });

    it('should get response from server (PUT)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);
        const response = {};

        imitateServer(transport, response);

        const result = await httpClient.put({ url: DEFAULT_URL });

        chai.expect(result).equal(response);
    });

    it('should get response from server (DELETE)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);
        const response = {};

        imitateServer(transport, response);

        const result = await httpClient.delete({ url: DEFAULT_URL });

        chai.expect(result).equal(response);
    });

    it('should fail correctly, if server returns error', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

        imitateFailedServer(transport, new Error('test'));

        try {
            await httpClient.post({ url: DEFAULT_URL });
        } catch (error) {
            chai.expect(error).instanceof(Error);
        }
    });

    it('should get an error if response has no uid', (callback) => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

        //imitate a server
        transport.on(HttpMessageType.send, (data: Request, src: string) => {
            transport.send(src, HttpMessageType.response, {});
        });

        httpClient.post({
            url: DEFAULT_URL
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


