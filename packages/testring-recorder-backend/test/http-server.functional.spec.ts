/// <reference types="mocha" />

import * as path from 'path';
import * as fs from 'fs';
import * as chai from 'chai';
import * as request from 'request-promise';

import { getAvailablePort } from '@testring/test-utils';

import { RecorderHttpServer } from '../src/http-server';

const index = fs.readFileSync(
    path.resolve(__dirname, './fixtures/templates/index.hbs'),
    { encoding: 'utf8' }
);

const host = 'localhost';

describe('Recorder HTTP server', () => {
    let httpPort = 8080;

    beforeEach(async () => {
        httpPort = await getAvailablePort(httpPort, host);
    });

    it('should serve over HTTP until it stopped', (callback) => {
        const server = new RecorderHttpServer(
            path.resolve(__dirname, './fixtures/static'),
            path.resolve(__dirname, './fixtures/templates'),
            host,
            httpPort
        );

        server.run().then(() => {
            const url = `http://${host}:${httpPort}`;

            request(url).then(async (res) => {
                chai.expect(res).to.be.equal(index);

                await server.stop();

                try {
                    await request(url);

                    callback(new Error('Still serving'));
                } catch {
                    callback();
                }
            });
        });
    });
});
