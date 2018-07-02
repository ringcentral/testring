/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import * as sinon from 'sinon';
import { TransportMock } from '@testring/test-utils';
import { LoggerMessageTypes, LogTypes } from '@testring/types';
import { LoggerClient } from '../src/logger-client';
import { report } from './fixtures/constants';

describe('Logger client', () => {
    it('should broadcast messages on log, info, warn, error and debug', (callback) => {
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);

        setImmediate(() => {
            if (spy.callCount === 5) {
                callback();
            } else {
                callback(new Error(`broadcasted ${spy.callCount} times`));
            }
        });
    });

    it('should batch log reports when step started, and broadcast them to server when step finished', () => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);
        const message = 'test step';

        transport.on(
            LoggerMessageTypes.REPORT_BATCH,
            (batch) => {
                chai.expect(batch).to.be.an('array').with.length(3);

                chai.expect(batch[0]).to.deep.include({
                    type: LogTypes.step,
                    content: [ message ],
                    parentStep: null,
                });

                const { stepUid } = batch[0];

                chai.expect(batch[1]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'foo' ],
                    parentStep: stepUid,
                });

                chai.expect(batch[2]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'bar' ],
                    parentStep: stepUid,
                });
            }
        );

        loggerClient.step(message, () => {
            loggerClient.log('foo');
            loggerClient.log('bar');
        });
    });

    it('should wait for promise to resolve before end step', () => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);
        const message = 'test step';

        transport.on(
            LoggerMessageTypes.REPORT_BATCH,
            (batch) => {
                chai.expect(batch).to.be.an('array').with.length(3);
            }
        );

        loggerClient.step(message, () => new Promise(
            (resolve) => {
                setTimeout(() => {
                    resolve();
                }, 100);
            }
        ));

        loggerClient.log('foo');
        loggerClient.log('bar');
    });

    it('should nest steps', () => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);
        const stepMessage1 = 'step 1';
        const stepMessage2 = 'step 2';

        transport.on(
            LoggerMessageTypes.REPORT_BATCH,
            (batch) => {
                chai.expect(batch).to.be.an('array').with.length(5);

                chai.expect(batch[0]).to.deep.include({
                    type: LogTypes.step,
                    content: [ stepMessage1 ],
                    parentStep: null,
                });

                const step1 = batch[0].stepUid;

                chai.expect(batch[1]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'foo' ],
                    parentStep: step1,
                });

                chai.expect(batch[2]).to.deep.include({
                    type: LogTypes.step,
                    content: [ stepMessage2 ],
                    parentStep: step1,
                });

                const step2 = batch[2].stepUid;

                chai.expect(batch[3]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'bar' ],
                    parentStep: step2,
                });

                chai.expect(batch[4]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'baz' ],
                    parentStep: step1,
                });
            }
        );

        loggerClient.step(stepMessage1, async () => {
            loggerClient.log('foo');

            loggerClient.step(stepMessage2, () => {
                loggerClient.log('bar');
            });

            loggerClient.log('baz');
        });
    });

    it('should allow to start and stop steps manually', () => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);

        transport.on(
            LoggerMessageTypes.REPORT_BATCH,
            (batch) => {
                chai.expect(batch).to.be.an('array').with.length(2);

                chai.expect(batch[0]).to.deep.include({
                    type: LogTypes.step,
                    content: [ 'step1' ],
                    parentStep: null,
                });

                const step1 = batch[0].stepUid;

                chai.expect(batch[1]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'foo' ],
                    parentStep: step1,
                });
            }
        );

        loggerClient.startStep('step1');
        loggerClient.log('foo');
        loggerClient.endStep();
    });

    it('should nest manually started steps', () => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);

        transport.on(
            LoggerMessageTypes.REPORT_BATCH,
            (batch) => {
                chai.expect(batch).to.be.an('array').with.length(5);

                chai.expect(batch[0]).to.deep.include({
                    type: LogTypes.step,
                    content: [ 'step1' ],
                    parentStep: null,
                });

                const step1 = batch[0].stepUid;

                chai.expect(batch[1]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'foo' ],
                    parentStep: step1,
                });

                chai.expect(batch[2]).to.deep.include({
                    type: LogTypes.step,
                    content: [ 'step2' ],
                    parentStep: step1,
                });

                const step2 = batch[2].stepUid;

                chai.expect(batch[3]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'bar' ],
                    parentStep: step2,
                });

                chai.expect(batch[4]).to.deep.include({
                    type: LogTypes.log,
                    content: [ 'baz' ],
                    parentStep: step1,
                });
            }
        );

        loggerClient.startStep('step1');
        loggerClient.log('foo');
        loggerClient.startStep('step2');
        loggerClient.log('bar');
        loggerClient.endStep();
        loggerClient.log('baz');
        loggerClient.endStep();
    });

    it('should not try to send log batch if endStep was invoked when step stack is empty', (callback) => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);

        transport.on(
            LoggerMessageTypes.REPORT_BATCH,
            () => {
                callback('batch was sent');
            }
        );

        loggerClient.endStep();

        setTimeout(() => {
            callback();
        }, 0);
    });
});
