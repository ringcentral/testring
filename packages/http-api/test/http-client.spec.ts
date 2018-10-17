/// <reference types="mocha" />

import * as chai from 'chai';
import { IHttpRequestMessage, HttpMessageType } from '@testring/types';
import { TransportMock } from '@testring/test-utils';
import { HttpClient } from '../src/http-client';

const DEFAULT_URL = 'test.com/invalid/test/url';
const DEFAULT_RESPONSE = {
    body: {}
};

const httpThrottleMock = 0;

const imitateServer = (transport: TransportMock, response) => {
    transport.on(HttpMessageType.send, (data: IHttpRequestMessage, src: string) => {
        transport.send(src, HttpMessageType.response, {
            uid: data.uid,
            response
        });
    });
};

const imitateFailedServer = (transport: TransportMock, error: Error) => {
    transport.on(HttpMessageType.send, (data: IHttpRequestMessage, src: string) => {
        transport.send(src, HttpMessageType.reject, {
            uid: data.uid,
            error
        });
    });
};

describe('HttpClient', () => {
    it('should get an error if request is null', (callback) => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, httpThrottleMock);

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
        const httpClient = new HttpClient(transport, httpThrottleMock);

        imitateServer(transport, DEFAULT_RESPONSE);

        const result = await httpClient.get({ url: DEFAULT_URL });

        chai.expect(result).equal(DEFAULT_RESPONSE.body);
    });

    it('should get response from server (POST)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, httpThrottleMock);

        imitateServer(transport, DEFAULT_RESPONSE);

        const result = await httpClient.post({ url: DEFAULT_URL });

        chai.expect(result).equal(DEFAULT_RESPONSE.body);
    });

    it('should get response from server (PUT)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, httpThrottleMock);

        imitateServer(transport, DEFAULT_RESPONSE);

        const result = await httpClient.put({ url: DEFAULT_URL });

        chai.expect(result).equal(DEFAULT_RESPONSE.body);
    });

    it('should get response from server (DELETE)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, httpThrottleMock);

        imitateServer(transport, DEFAULT_RESPONSE);

        const result = await httpClient.delete({ url: DEFAULT_URL });

        chai.expect(result).equal(DEFAULT_RESPONSE.body);
    });

    it('should fail correctly, if server returns error', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, httpThrottleMock);

        imitateFailedServer(transport, new Error('test'));

        try {
            await httpClient.post({ url: DEFAULT_URL });
        } catch (error) {
            chai.expect(error).instanceof(Error);
        }
    });

    it('should get an error if response has no uid', (callback) => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, httpThrottleMock);

        //imitate a server
        transport.on(HttpMessageType.send, (data: IHttpRequestMessage, src: string) => {
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
    it('should return queue requests responses in proper way', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, 500);
        
        const responses = [1, 2, 3];

        transport.on(HttpMessageType.send, (data: IHttpRequestMessage, src: string) => {
            transport.send(src, HttpMessageType.response, {
                uid: data.uid,
                response: {
                    body: responses[data.request.body.requestId]
                }
            });
        });

        const results: Array<any> = [];

        const runRequest = async (requestId: number) => {
            const result = await httpClient.get({ url: DEFAULT_URL, body: { requestId } });
            results.push(result);
        };

        await Promise.all([
            runRequest(0),
            runRequest(1),
            runRequest(2),
        ]);

        chai.expect(results).to.deep.equal(responses);
    });
    it('should execute queued requests one by one with exact timeouts', async () => {
        const throttleTimeout = 200;
        const responseTime = 100;
        const fullTime = throttleTimeout + responseTime;

        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, throttleTimeout);
        
        transport.on(HttpMessageType.send, async (data: IHttpRequestMessage, src: string) => {
            await new Promise(resolve => setTimeout(resolve, responseTime));
            transport.send(src, HttpMessageType.response, {
                uid: data.uid,
                response: DEFAULT_RESPONSE
            });
        });

        const results: Array<any> = [];

        const runRequest = async () => {
            const queued = Date.now();
            await httpClient.get({ url: DEFAULT_URL });
            const executed = Date.now();
            results.push(executed - queued);
        };

        await Promise.all([
            runRequest(),
            runRequest(),
            runRequest(),
        ]);

        chai.expect(results[1] - results[0]).to.be.gte(fullTime);
        chai.expect(results[2] - results[1]).to.be.gte(fullTime);
    });
});


