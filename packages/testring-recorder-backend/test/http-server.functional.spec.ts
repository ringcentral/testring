/// <reference types="mocha" />

import * as path from 'path';
import * as fs from 'fs';
import * as chai from 'chai';
import * as request from 'request-promise';
import { RecorderHttpServer } from '../src/http-server';

const index = fs.readFileSync(
    path.resolve(__dirname, './fixtures/templates/index.hbs'),
    { encoding: 'utf8' }
);

describe('Recorder HTTP server', () => {
    it('should serve over HTTP until it stopped', (callback) => {
        const server = new RecorderHttpServer(
            path.resolve(__dirname, './fixtures/static'),
            path.resolve(__dirname, './fixtures/templates'),
            'localhost',
            8080
        );

        server.run().then(() => {
            request('http://localhost:8080').then(async (res) => {
                chai.expect(res).to.be.equal(index);

                await server.stop();

                try {
                    await request('http://localhost:8080');

                    callback(new Error('Still serving'));
                } catch {
                    callback();
                }
            });
        });
    });
});
