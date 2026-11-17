/// <reference types="mocha" />

import * as chai from 'chai';
import sinon from 'sinon';

import {loggerClient} from '@testring/logger';
import {TestEvents} from '@testring/types';

import {run} from '../src/run';
import {TestContext} from '../src/test-context';
import {
    testAPIController,
    TestAPIController,
} from '../src/test-api-controller';

const TEST_ID = 'test.js';
const LOG_PREFIX = '[logged inside test]';

type Restorable = {
    restore: () => void;
};

type RunEvents = {
    failedErrors: Error[];
    getFinishedCount: () => number;
    cleanup: () => void;
};

function prepareTestAPI(): void {
    testAPIController.setTestID(TEST_ID);
    testAPIController.setTestParameters({runData: {}});
    testAPIController.setEnvironmentParameters({});
}

function observeRunEvents(): RunEvents {
    const bus = testAPIController.getBus();
    let finishedCount = 0;
    const failedErrors: Error[] = [];

    const finishedHandler = () => {
        finishedCount += 1;
    };
    const failedHandler = (error: Error) => {
        failedErrors.push(error);
    };

    bus.on(TestEvents.finished, finishedHandler);
    bus.on(TestEvents.failed, failedHandler);

    return {
        failedErrors,
        getFinishedCount: () => finishedCount,
        cleanup: () => {
            bus.removeListener(TestEvents.finished, finishedHandler);
            bus.removeListener(TestEvents.failed, failedHandler);
        },
    };
}

function track<T extends Restorable>(
    restorables: Restorable[],
    restorable: T,
): T {
    restorables.push(restorable);

    return restorable;
}

function restoreAll(restorables: Restorable[]): void {
    for (const restorable of restorables.reverse()) {
        restorable.restore();
    }
}

describe('TestContext', () => {
    let restorables: Restorable[];

    beforeEach(() => {
        restorables = [];
    });

    afterEach(() => {
        restoreAll(restorables);
    });

    it('should log cleanup errors as warnings and rethrow them', async () => {
        const context = new TestContext({});
        const cleanupError = new Error('cleanup failed');
        const application = {
            isStopped: sinon.stub().returns(false),
            end: sinon.stub().rejects(cleanupError),
        };
        const warn = track(restorables, sinon.stub(loggerClient, 'warn'));

        Object.defineProperty(context, 'application', {
            value: application,
            configurable: true,
        });

        try {
            await context.end();
            chai.assert.fail('Expected context.end() to reject.');
        } catch (error) {
            chai.expect(error).to.equal(cleanupError);
        }

        chai.expect(warn.calledOnceWithExactly(LOG_PREFIX, cleanupError)).to.be
            .equal(true);
    });

    it('should await every cleanup and retain failures in application order', async () => {
        const context = new TestContext({});
        const firstError = new Error('primary cleanup failed');
        const secondError = new Error('custom cleanup failed');
        let finishDelayedCleanup!: () => void;
        let delayedCleanupFinished = false;
        const delayedCleanup = new Promise<void>((resolve) => {
            finishDelayedCleanup = () => {
                delayedCleanupFinished = true;
                resolve();
            };
        });
        const applications = [
            {isStopped: () => false, end: () => Promise.reject(firstError)},
            {isStopped: () => false, end: () => delayedCleanup},
            {isStopped: () => false, end: () => Promise.reject(secondError)},
        ];
        const warn = track(restorables, sinon.stub(loggerClient, 'warn'));
        Object.defineProperty(context, 'application', {
            value: applications[0],
            configurable: true,
        });
        (context as any).customApplications.add(applications[1]);
        (context as any).customApplications.add(applications[2]);

        const cleanup = context.end();
        await Promise.resolve();
        finishDelayedCleanup();
        const [result] = await Promise.allSettled([cleanup]);

        chai.expect(delayedCleanupFinished).to.equal(true);
        chai.expect(result?.status).to.equal('rejected');
        const error = (result as PromiseRejectedResult).reason;
        chai.expect(error).to.equal(firstError);
        chai.expect(error.cleanupErrors).to.deep.equal([
            firstError,
            secondError,
        ]);
        chai.expect(warn.callCount).to.equal(2);
    });
});

describe('TestAPIController callbacks', () => {
    for (const stage of ['Before', 'After'] as const) {
        it(`should detach and discard a failed ${stage.toLowerCase()}-run batch while retaining new registrations`, async () => {
            const controller = new TestAPIController() as any;
            const calls: string[] = [];
            const register = `register${stage}RunCallback`;
            const flush = `flush${stage}RunCallbacks`;

            controller[register](() => {
                calls.push('failed');
                controller[register](() => calls.push('next'));
                throw new Error('callback failed');
            });
            controller[register](() => calls.push('discarded'));

            const [first] = await Promise.allSettled([controller[flush]()]);
            chai.expect(first?.status).to.equal('rejected');
            await controller[flush]();
            await controller[flush]();

            chai.expect(calls).to.deep.equal(['failed', 'next']);
        });
    }
});

describe('run', () => {
    let restorables: Restorable[];
    let events: RunEvents;
    let endStep: ReturnType<typeof sinon.stub>;

    beforeEach(() => {
        restorables = [];
        prepareTestAPI();
        events = observeRunEvents();
        track(restorables, sinon.stub(loggerClient, 'startStep'));
        endStep = track(restorables, sinon.stub(loggerClient, 'endStep'));
    });

    afterEach(() => {
        events.cleanup();
        restoreAll(restorables);
    });

    it('should finish the test when body and cleanup pass', async () => {
        const end = track(restorables, sinon.stub(TestContext.prototype, 'end'));
        end.resolves();

        await run(() => undefined);

        chai.expect(end.calledOnce).to.equal(true);
        chai.expect(events.getFinishedCount()).to.equal(1);
        chai.expect(events.failedErrors).to.deep.equal([]);
        chai.expect(endStep.calledOnceWithExactly(TEST_ID, 'Test passed')).to
            .equal(true);
    });

    it('should fail the test when cleanup fails after a passed body', async () => {
        const cleanupError = new Error('cleanup failed');
        const end = track(restorables, sinon.stub(TestContext.prototype, 'end'));
        end.rejects(cleanupError);

        await run(() => undefined);

        chai.expect(end.calledOnce).to.equal(true);
        chai.expect(events.getFinishedCount()).to.equal(0);
        chai.expect(events.failedErrors).to.deep.equal([cleanupError]);
        chai.expect(
            endStep.calledOnceWithExactly(
                TEST_ID,
                'Test failed',
                cleanupError,
            ),
        ).to.equal(true);
    });

    it('should keep the body error primary when body and cleanup both fail', async () => {
        const bodyError = new Error('body failed');
        const cleanupError = new Error('cleanup failed');
        const end = track(restorables, sinon.stub(TestContext.prototype, 'end'));
        end.rejects(cleanupError);

        await run(() => {
            throw bodyError;
        });

        chai.expect(end.calledOnce).to.equal(true);
        chai.expect(events.getFinishedCount()).to.equal(0);
        chai.expect(events.failedErrors).to.deep.equal([bodyError]);
        chai.expect((bodyError as any).cleanupErrors).to.deep.equal([
            cleanupError,
        ]);
        chai.expect(
            endStep.calledOnceWithExactly(TEST_ID, 'Test failed', bodyError),
        ).to.equal(true);
    });
});
