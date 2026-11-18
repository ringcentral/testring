/// <reference types="mocha" />

import * as chai from 'chai';
import {fork} from '@testring/child-process';
import {Transport} from '@testring/transport';

const HTTP_REJECT = 'rejectHttpRequest';

describe('HTTP transport functional test', () => {
    it('delivers a portable HTTP error to a child process', async () => {
        const child = await fork(
            'test/fixtures/http-transport-worker.ts',
        );
        const transport = new Transport();
        const response = new Promise<any>((resolve) => {
            child.on('message', (message: any) => {
                if (message?.name === 'StatusCodeError') {
                    resolve(message);
                }
            });
        });
        transport.registerChild('http-worker', child);

        try {
            await transport.send('http-worker', HTTP_REJECT, {
                uid: 'functional-http-error',
                error: Object.assign(new Error('HTTP 503'), {
                    name: 'StatusCodeError',
                    statusCode: 503,
                    responseBody: {message: 'unavailable'},
                }),
            });

            chai.expect(await response).to.deep.equal({
                name: 'StatusCodeError',
                message: 'HTTP 503',
                statusCode: 503,
                responseBody: {message: 'unavailable'},
            });
        } finally {
            child.kill();
        }
    });
});
