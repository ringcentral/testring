/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import { fork } from '@testring/child-process';
import { Transport } from '@testring/transport';
import { WebApplicationControllerEventType } from '@testring/types';
import { BrowserProxyControllerMock } from '@testring/test-utils';
import { WebApplicationController } from '../src/web-application-controller';
import { ELEMENT_NAME, TEST_NAME } from './fixtures/constants';

const nanoid = require('nanoid');

const testProcessPath = path.resolve(__dirname, './fixtures/test-process.ts');

// TODO add more tests
describe('WebApplicationController functional', () => {
    it('should get messages from', (callback) => {
        const processID = nanoid();

        const transport = new Transport();
        const browserProxyMock = new BrowserProxyControllerMock();
        const controller = new WebApplicationController(browserProxyMock, transport);

        fork(testProcessPath).then((testProcess) => {
            controller.init();
            transport.registerChildProcess(processID, testProcess);

            controller.on(WebApplicationControllerEventType.afterResponse, (message) => {
                try {
                    const requests = browserProxyMock.$getCommands();

                    chai.expect(requests).to.have.lengthOf(1);

                    const request = requests[0];

                    chai.expect(request.args[0]).includes(ELEMENT_NAME);
                    chai.expect(message.command).to.be.equal(request);
                    chai.expect(message.applicant).includes(TEST_NAME);

                    callback();
                } catch (e) {
                    callback(e);
                } finally {
                    setImmediate(() => {
                        testProcess.kill();
                    });
                }
            });

            testProcess.stderr.on('data', (message) => {
                callback(message.toString());
            });
        });
    }).timeout(30000);
});
