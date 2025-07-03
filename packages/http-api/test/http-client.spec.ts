/// <reference types="mocha" />

import * as chai from 'chai';
import * as sinon from 'sinon';
import {IHttpRequestMessage, HttpMessageType, IHttpResponse} from '@testring/types';
import {TransportMock} from '@testring/test-utils';
import {HttpClient} from '../src/http-client';

type resolveFn = (value?: void | PromiseLike<void>) => void;

const DEFAULT_URL = 'test.com/invalid/test/url';
const DEFAULT_RESPONSE = {
    body: {},
};

const imitateServer = (transport: TransportMock, response: Partial<IHttpResponse>) => {
    transport.on(
        HttpMessageType.send,
        (data: IHttpRequestMessage, src?: string) => {
            transport.send(src as string, HttpMessageType.response, {
                uid: data.uid,
                response,
            });
        },
    );
};

const imitateFailedServer = (transport: TransportMock, error: Error) => {
    transport.on(
        HttpMessageType.send,
        (data: IHttpRequestMessage, src?: string) => {
                transport.send(src as string, HttpMessageType.reject, {
                uid: data.uid,
                error,
            });
        },
    );
};

describe('HttpClient', () => {
    it('should get an error if request is null', (callback) => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

        httpClient
            .post(null as any)
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

        imitateServer(transport, DEFAULT_RESPONSE);

        const result = await httpClient.get({url: DEFAULT_URL});

        chai.expect(result).equal(DEFAULT_RESPONSE.body);
    });

    it('should get response from server (POST)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

        imitateServer(transport, DEFAULT_RESPONSE);

        const result = await httpClient.post({url: DEFAULT_URL});

        chai.expect(result).equal(DEFAULT_RESPONSE.body);
    });

    it('should get response from server (PUT)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

        imitateServer(transport, DEFAULT_RESPONSE);

        const result = await httpClient.put({url: DEFAULT_URL});

        chai.expect(result).equal(DEFAULT_RESPONSE.body);
    });

    it('should get response from server (DELETE)', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

        imitateServer(transport, DEFAULT_RESPONSE);

        const result = await httpClient.delete({url: DEFAULT_URL});

        chai.expect(result).equal(DEFAULT_RESPONSE.body);
    });

    it('should fail correctly, if server returns error', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

        imitateFailedServer(transport, new Error('test'));

        try {
            await httpClient.post({url: DEFAULT_URL});
        } catch (error) {
            chai.expect(error).instanceof(Error);
        }
    });

    it('should get an error if response has no uid', (callback) => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport);

        //imitate a server
        transport.on(
            HttpMessageType.send,
            (_data: IHttpRequestMessage, src?: string) => {
                transport.send(src as string, HttpMessageType.response, {});
            },
        );

        httpClient
            .post({
                url: DEFAULT_URL,
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

    it('should return queue requests responses in proper order', async () => {
        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, {httpThrottle: 100});

        const responses = [1, 2, 3];

        // imitate server
        transport.on(
            HttpMessageType.send,
            (data: IHttpRequestMessage, src?: string) => {
                transport.send(src as string, HttpMessageType.response, {
                    uid: data.uid,
                    response: {
                        body: responses[data.request.body.requestId],
                    },
                });
            },
        );

        const results: Array<any> = [];

        const runRequest = async (requestId: number) => {
            const result = await httpClient.get({
                url: DEFAULT_URL,
                body: {requestId},
            });
            results.push(result);
        };

        // run all requests at the same time
        await Promise.all([runRequest(0), runRequest(1), runRequest(2)]);

        chai.expect(results).to.deep.equal(responses);
    });

    it('should execute queued requests one by one with timeouts', async () => {
        const httpThrottle = 200;
        const queue: resolveFn[] = [];
        let finishedRequests = 0;

        const transport = new TransportMock();
        const httpClient = new HttpClient(transport, {httpThrottle});

        const stub = sinon
            .stub(httpClient as any, 'throttleDelay')
            .callsFake(function fakeThrottle() {
                return new Promise<void>((resolve) => queue.push(resolve));
            });

        transport.on(
            HttpMessageType.send,
            async (data: IHttpRequestMessage, src?: string) => {
                transport.send(src as string, HttpMessageType.response, {
                    uid: data.uid,
                    response: DEFAULT_RESPONSE,
                });
            },
        );

        const runRequest = async () => {
            await httpClient.get({url: DEFAULT_URL});
            finishedRequests++;
        };

        await runRequest();
        const secondRequest = runRequest();
        const thirdRequest = runRequest();

        chai.expect(finishedRequests).to.be.eq(1);
        queue[0]?.();
        await secondRequest;
        chai.expect(finishedRequests).to.be.eq(2);
        queue[1]?.();
        await thirdRequest;
        chai.expect(finishedRequests).to.be.eq(3);

        stub.restore();
    });
});
