/// <reference types="mocha" />

// Validates User Story 1 (spec.md, Priority P1): a failing autotest's stack
// trace must point at the exact authored file/line (FR-002/SC-002), and a
// failure originating inside testring/test-framework code the autotest
// invoked must preserve the real intermediate frames rather than hide them
// (FR-003). Native `import()` (this feature's replacement for the deleted
// vm-sandbox) surfaces genuine V8 stack traces with no synthetic wrapping,
// so both properties hold without any frame-rewriting logic on our part —
// these tests exist to pin that down as a regression guard.

import * as chai from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {TransportMock} from '@testring/test-utils';
import {TestAPIController, testAPIController} from '@testring/api';
import {
    TestWorkerAction,
    TestStatus,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
} from '@testring/types';
import {WorkerController} from '../src/worker/worker-controller';

const TESTRING_API_ABSOLUTE_PATH = require.resolve('@testring/api');

let fixtureCounter = 0;

function writeFixture(content: string): string {
    const filePath = path.join(
        os.tmpdir(),
        `testring-stack-trace-spec-${process.pid}-${fixtureCounter++}.js`,
    );

    fs.writeFileSync(filePath, content);

    return filePath;
}

function runFixture(content: string): Promise<ITestExecutionCompleteMessage> {
    return new Promise((resolve) => {
        const transportMock = new TransportMock();
        // Must be the real @testring/api singleton, not a fresh
        // TestAPIController: the fixture below accesses testring's own
        // `testAPIController` export (via `import('@testring/api')`
        // inside the imported test file), so its bus has to be the exact
        // same instance this WorkerController is listening on.
        const workerController = new WorkerController(
            transportMock,
            testAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            resolve,
        );

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content,
                path: writeFixture(content),
                parameters: {},
                envParameters: null,
                workerId: 'worker/stack-trace-accuracy-spec',
            },
        );
    });
}

describe('stack trace accuracy (FR-002/FR-003, US1)', () => {
    it('reports the exact authored file/line for a direct assertion failure (SC-002)', async () => {
        // Line 1 is intentionally blank so the throw below sits on a known,
        // non-trivial line number rather than line 1.
        const content = [
            '',
            'function deliberatelyFailingAssertion() {',
            "    throw new Error('deliberate known-line failure');",
            '}',
            '',
            'deliberatelyFailingAssertion();',
            '',
        ].join('\n');
        const knownThrowLine = 3;

        const filePath = writeFixture(content);
        const transportMock = new TransportMock();
        const workerController = new WorkerController(
            transportMock,
            new TestAPIController(),
        );

        workerController.init();

        const message = await new Promise<ITestExecutionCompleteMessage>(
            (resolve) => {
                transportMock.on<ITestExecutionCompleteMessage>(
                    TestWorkerAction.executionComplete,
                    resolve,
                );

                transportMock.broadcast<ITestExecutionMessage>(
                    TestWorkerAction.executeTest,
                    {
                        waitForRelease: false,
                        content,
                        path: filePath,
                        parameters: {},
                        envParameters: null,
                        workerId: 'worker/stack-trace-accuracy-spec',
                    },
                );
            },
        );

        chai.expect(message.status).to.be.equal(TestStatus.failed);

        const stack = (message.error as Error).stack || '';
        const topFrame = stack.split('\n')[1] || '';

        chai.expect(topFrame).to.include(filePath);
        chai.expect(topFrame).to.include(`:${knownThrowLine}:`);
    });

    it('preserves the real testring call-chain frame for a framework-originated failure (FR-003)', async () => {
        const ERROR_TEXT = 'failure raised through testring api.run()';

        // Uses testAPIController's real (non-browser) before-run-callback
        // pipeline as the "framework code invoked by the autotest" —
        // real testring source, with no WebApplication/browser-proxy
        // session lifecycle to stand up for a unit test.
        const content = `
            const api = (await import('${TESTRING_API_ABSOLUTE_PATH}')).default;
            const bus = api.testAPIController.getBus();

            api.testAPIController.registerBeforeRunCallback(function realFrameworkCallback() {
                throw new Error("${ERROR_TEXT}");
            });

            await bus.startedTest();

            try {
                await api.testAPIController.flushBeforeRunCallbacks();
                await bus.finishedTest();
            } catch (err) {
                await bus.failedTest(err);
            }
        `;

        const message = await runFixture(content);

        chai.expect(message.status).to.be.equal(TestStatus.failed);
        chai.expect((message.error as Error).message).to.be.equal(ERROR_TEXT);

        const stack = (message.error as Error).stack || '';

        // The throw's own frame (inside the autotest file).
        chai.expect(stack).to.include('realFrameworkCallback');
        // The real testring frame that invoked it — proves no real
        // intermediate frame between the autotest and the point of failure
        // was hidden or renumbered. (mocha's ts-node source-map support
        // resolves this to the original .ts source rather than the
        // compiled dist .js, which is fine — either way it's a real,
        // accurately-attributed testring frame, not a hidden one.)
        chai.expect(stack).to.match(
            /flushBeforeRunCallbacks \(.*test-api-controller\.(js|ts)/,
        );
    });
});
