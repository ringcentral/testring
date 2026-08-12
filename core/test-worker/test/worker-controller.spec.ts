/// <reference types="mocha" />
/* eslint sonarjs/no-identical-functions: 0 */

import * as chai from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {TransportMock} from '@testring/test-utils';
import {testAPIController, TestAPIController} from '@testring/api';
import {
    TestWorkerAction,
    TestStatus,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
} from '@testring/types';
import {WorkerController} from '../src/worker/worker-controller';

const TESTRING_API_ABSOLUTE_PATH = require.resolve('@testring/api');

// Native `import()` requires a real file on disk (unlike the deleted
// vm-sandbox, which could execute an arbitrary in-memory content string
// under a synthetic path) — so these fixtures are written out and imported
// by their real path.
let fixtureCounter = 0;

function writeFixture(content: string): string {
    const filePath = path.join(
        os.tmpdir(),
        `testring-worker-controller-spec-${process.pid}-${fixtureCounter++}.js`,
    );

    fs.writeFileSync(filePath, content);

    return filePath;
}

describe('WorkerController', () => {
    it('should run sync test', (callback) => {
        const transportMock = new TransportMock();
        const nTestAPIController = new TestAPIController();
        const workerController = new WorkerController(
            transportMock,
            nTestAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.done);
                chai.expect(message.error).to.be.equal(null);

                callback();
            },
        );

        const content = `
            function test () {}
            test();
        `;

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content,
                path: writeFixture(content),
                parameters: {},
                envParameters: null,
                workerId: 'worker/test',
            },
        );
    });

    it('should fail sync test correctly', (callback) => {
        const ERROR_TEXT = 'look ama error';

        const transportMock = new TransportMock();
        const nTestAPIController = new TestAPIController();
        const workerController = new WorkerController(
            transportMock,
            nTestAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.failed);
                chai.expect(message.error).to.be.instanceof(Error);
                chai.expect((message.error as Error).message).to.be.equal(
                    ERROR_TEXT,
                );

                callback();
            },
        );

        const content = `throw new Error("${ERROR_TEXT}")`;

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content,
                path: writeFixture(content),
                parameters: {},
                envParameters: null,
                workerId: 'worker/test',
            },
        );
    });

    it('should run async test', (callback) => {
        const transportMock = new TransportMock();
        const workerController = new WorkerController(
            transportMock,
            testAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.done);
                chai.expect(message.error).to.be.equal(null);

                callback();
            },
        );

        const content = `
                const api = (await import('${TESTRING_API_ABSOLUTE_PATH}')).default;

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);
                    var bus = api.testAPIController.getBus();

                    await bus.startedTest();

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        await bus.finishedTest();
                    } catch (err) {
                        await bus.failedTest(err);
                    }
                };

                async function test() {
                }

                runMock(test);
            `;

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content,
                path: writeFixture(content),
                parameters: {},
                envParameters: null,
                workerId: 'worker/test',
            },
        );
    });

    it('should fail async test', (callback) => {
        const ERROR_TEXT = 'look ama error';

        const transportMock = new TransportMock();
        const workerController = new WorkerController(
            transportMock,
            testAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.failed);
                chai.expect(message.error).to.be.instanceof(Error);
                chai.expect((message.error as Error).message).to.be.equal(
                    ERROR_TEXT,
                );

                callback();
            },
        );

        const content = `
                const api = (await import('${TESTRING_API_ABSOLUTE_PATH}')).default;

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);
                    var bus = api.testAPIController.getBus();

                    await bus.startedTest();

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        await bus.finishedTest();
                    } catch (err) {
                        await bus.failedTest(err);
                    }
                };

                async function test() {
                    throw new Error("${ERROR_TEXT}");
                }

                runMock(test);
            `;

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content,
                path: writeFixture(content),
                parameters: {},
                envParameters: null,
                workerId: 'worker/test',
            },
        );
    });

    it('should run async test with await pending in it', (callback) => {
        const transportMock = new TransportMock();
        const workerController = new WorkerController(
            transportMock,
            testAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.done);
                chai.expect(message.error).to.be.equal(null);

                callback();
            },
        );

        const content = `
                const api = (await import('${TESTRING_API_ABSOLUTE_PATH}')).default;

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);
                    var bus = api.testAPIController.getBus();

                    await bus.startedTest();

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        await bus.finishedTest();
                    } catch (err) {
                        await bus.failedTest(err);
                    }
                };

                async function test() {
                    await new Promise(resolve => setTimeout(() => resolve(), 300));
                }

                runMock(test);
            `;

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content,
                path: writeFixture(content),
                parameters: {},
                envParameters: null,
                workerId: 'worker/test',
            },
        );
    });
});
