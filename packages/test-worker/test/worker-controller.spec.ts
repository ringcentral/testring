/// <reference types="mocha" />

import * as chai from 'chai';
import { TransportMock } from '@testring/test-utils';
import { TestAPIController } from '@testring/api';
import {
    TestWorkerAction,
    TestStatus,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
} from '@testring/types';
import { WorkerController } from '../src/worker/worker-controller';

describe('WorkerController', () => {
    it('should run sync test', (callback) => {
        const transportMock = new TransportMock();
        const testAPIController = new TestAPIController();
        const workerController = new WorkerController(transportMock, testAPIController);

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, (message) => {
            chai.expect(message.status).to.be.equal(TestStatus.done);
            chai.expect(message.error).to.be.equal(null);

            callback();
        });

        transportMock.broadcast<ITestExecutionMessage>(TestWorkerAction.executeTest, {
            content: `
                function test () {} 
                test();
            `,
            path: 'test.js',
            dependencies: {},
            parameters: {},
            envParameters: null,
        });
    });

    it('should fail sync test correctly', (callback) => {
        const ERROR_TEXT = 'look ama error';

        const transportMock = new TransportMock();
        const testAPIController = new TestAPIController();
        const workerController = new WorkerController(transportMock, testAPIController);

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, (message) => {
            chai.expect(message.status).to.be.equal(TestStatus.failed);
            chai.expect(message.error).to.be.instanceof(Error);
            chai.expect((message.error as Error).message).to.be.equal(ERROR_TEXT);

            callback();
        });

        transportMock.broadcast<ITestExecutionMessage>(TestWorkerAction.executeTest, {
            content: `throw new Error("${ERROR_TEXT}")`,
            path: 'test.js',
            dependencies: {},
            parameters: {},
            envParameters: null,
        });
    });

    // TODO add tests for async test run
});
