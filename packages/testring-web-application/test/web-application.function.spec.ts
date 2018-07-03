/// <reference types="node" />
/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import { fork } from '@testring/child-process';
import { Transport } from '@testring/transport';
import { BrowserProxyControllerMock } from '@testring/test-utils';
import { WebApplicationControllerEventType } from '../src/structs';
import { ELEMENT_NAME, TEST_NAME } from './fixtures/constants';
import { WebApplicationController } from '../src/web-application-controller';

const testProcessPath = path.resolve(__dirname, './fixtures/test-process.ts');

// TODO add more tests
describe('WebApplication functional', () => {
    it('should get messages from', (callback) => {
        const transport = new Transport();
        const browserProxyMock = new BrowserProxyControllerMock();
        const controller = new WebApplicationController(browserProxyMock, transport);
        const testProcess = fork(testProcessPath);

        testProcess.stderr.on('data', (message) => {
            callback(message);
        });

        controller.init();
        transport.registerChildProcess('test', testProcess);

        controller.on(WebApplicationControllerEventType.afterResponse, (message) => {
            try {
                const requests = browserProxyMock.$getCommands();

                chai.expect(requests).to.have.lengthOf(1);

                const request = requests[0];

                chai.expect(request.args[0]).includes(ELEMENT_NAME);
                chai.expect(message.command).to.be.equal(request);
                chai.expect(message.applicant).to.be.equal(TEST_NAME);

                callback();
            } catch (e) {
                callback(e);
            } finally {
                setImmediate(() => {
                    testProcess.kill();
                });
            }
        });
    });
});
