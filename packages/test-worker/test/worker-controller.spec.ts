/// <reference types="mocha" />

import * as chai from 'chai';
import { TransportMock } from '@testring/test-utils';
import { testAPIController, TestAPIController } from '@testring/api';
import {
    TestWorkerAction,
    TestStatus,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
} from '@testring/types';
import { WorkerController } from '../src/worker/worker-controller';

const TESTRING_API_ABSOLUTE_PATH = require.resolve('@testring/api');
const TESTRING_TYPES_ABSOLUTE_PATH = require.resolve('@testring/types');

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
            waitForRelease: false,
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
            waitForRelease: false,
            content: `throw new Error("${ERROR_TEXT}")`,
            path: 'test.js',
            dependencies: {},
            parameters: {},
            envParameters: null,
        });
    });

    it('should run async test', (callback) => {
        const transportMock = new TransportMock();
        const workerController = new WorkerController(transportMock, testAPIController);

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, (message) => {
            chai.expect(message.status).to.be.equal(TestStatus.done);
            chai.expect(message.error).to.be.equal(null);

            callback();
        });

        transportMock.broadcast<ITestExecutionMessage>(TestWorkerAction.executeTest, {
            waitForRelease: false,
            content: `
                var api = require('${TESTRING_API_ABSOLUTE_PATH}');
                var types = require('${TESTRING_TYPES_ABSOLUTE_PATH}');

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);
                    var bus = api.testAPIController.getBus();

                    bus.emit(types.TestEvents.started);

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        bus.emit(types.TestEvents.finished);
                    } catch (err) {
                        bus.emit(types.TestEvents.failed, err);
                    }
                };
                
                async function test() {
                }
                
                runMock(test);
            `,
            path: 'test.js',
            dependencies: {},
            parameters: {},
            envParameters: null,
        });
    });

    it('should fail async test', (callback) => {
        const ERROR_TEXT = 'look ama error';

        const transportMock = new TransportMock();
        const workerController = new WorkerController(transportMock, testAPIController);

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, (message) => {
            chai.expect(message.status).to.be.equal(TestStatus.failed);
            chai.expect(message.error).to.be.instanceof(Error);
            chai.expect((message.error as Error).message).to.be.equal(ERROR_TEXT);

            callback();
        });

        transportMock.broadcast<ITestExecutionMessage>(TestWorkerAction.executeTest, {
            waitForRelease: false,
            content: `
                var api = require('${TESTRING_API_ABSOLUTE_PATH}');
                var types = require('${TESTRING_TYPES_ABSOLUTE_PATH}');

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);

                    api.testAPIController.getBus().emit(types.TestEvents.started);

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        api.testAPIController.getBus().emit(types.TestEvents.finished);
                    } catch (err) {
                        api.testAPIController.getBus().emit(types.TestEvents.failed, err);
                    }
                };
                
                async function test() {
                    throw new Error("${ERROR_TEXT}");
                }
                
                runMock(test);
            `,
            path: 'test.js',
            dependencies: {},
            parameters: {},
            envParameters: null,
        });
    });

    it('should run async test with await pending in it', (callback) => {
        const transportMock = new TransportMock();
        const workerController = new WorkerController(transportMock, testAPIController);

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, (message) => {
            chai.expect(message.status).to.be.equal(TestStatus.done);
            chai.expect(message.error).to.be.equal(null);

            callback();
        });

        transportMock.broadcast<ITestExecutionMessage>(TestWorkerAction.executeTest, {
            waitForRelease: false,
            content: `
                var api = require('${TESTRING_API_ABSOLUTE_PATH}');
                var types = require('${TESTRING_TYPES_ABSOLUTE_PATH}');

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);
                    var bus = api.testAPIController.getBus();

                    bus.emit(types.TestEvents.started);

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        bus.emit(types.TestEvents.finished);
                    } catch (err) {
                        bus.emit(types.TestEvents.failed, err);
                    }
                };
                
                async function test() {
                    await new Promise(resolve => setTimeout(() => resolve(), 300));
                }
                
                runMock(test);
            `,
            path: 'test.js',
            dependencies: {},
            parameters: {},
            envParameters: null,
        });
    });
});
