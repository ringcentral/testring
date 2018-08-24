/// <reference types="mocha" />

import * as chai from 'chai';
import * as sinon from 'sinon';
import { TransportMock } from '@testring/test-utils';
import { LoggerMessageTypes, LogTypes } from '@testring/types';
import { LoggerClient } from '../src/logger-client';
import { report } from './fixtures/constants';

describe('Logger client', () => {
    it('should broadcast messages on log, info, warn, error and debug', () => {
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);

        chai.expect(spy.callCount).to.be.equal(5);
    });

    it('should broadcast messages log, info, warn, error and debug with prefix', () => {
        const PREFIX = 'myPrefix';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);
        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);

        chai.expect(spy.callCount).to.be.equal(5);

        for (let i = 0, len = 5; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].prefix).to.be.equal(PREFIX);
        }
    });

    it('should batch log reports when step started, and broadcast them to server when step finished', () => {
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);
        const message = 'test step';

        transport.on(LoggerMessageTypes.REPORT_BATCH, spy);

        loggerClient.step(message, () => {
            loggerClient.log('foo');
            loggerClient.log('bar');
        });

        const batch = spy.getCall(0).args[0];

        chai.expect(batch).to.be.an('array').with.length(3);

        chai.expect(batch[0]).to.deep.include({
            type: LogTypes.step,
            content: [message],
            parentStep: null
        });

        const { stepUid } = batch[0];

        chai.expect(batch[1]).to.deep.include({
            type: LogTypes.log,
            content: ['foo'],
            parentStep: stepUid
        });

        chai.expect(batch[2]).to.deep.include({
            type: LogTypes.log,
            content: ['bar'],
            parentStep: stepUid
        });
    });

    it('should wait for promise to resolve before end step', (callback) => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);
        const message = 'test step';

        transport.on(LoggerMessageTypes.REPORT_BATCH, (batch) => {
            try {
                chai.expect(batch).to.be.an('array').with.length(3);
                callback();
            } catch (e) {
                callback(e);
            }
        });

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

    it('should nest steps', (callback) => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);
        const stepMessage1 = 'step 1';
        const stepMessage2 = 'step 2';

        transport.on(LoggerMessageTypes.REPORT_BATCH, (batch) => {
            try {
                chai.expect(batch).to.be.an('array').with.length(5);

                chai.expect(batch[0]).to.deep.include({
                    type: LogTypes.step,
                    content: [stepMessage1],
                    parentStep: null
                });

                const step1 = batch[0].stepUid;

                chai.expect(batch[1]).to.deep.include({
                    type: LogTypes.log,
                    content: ['foo'],
                    parentStep: step1
                });

                chai.expect(batch[2]).to.deep.include({
                    type: LogTypes.step,
                    content: [stepMessage2],
                    parentStep: step1
                });

                const step2 = batch[2].stepUid;

                chai.expect(batch[3]).to.deep.include({
                    type: LogTypes.log,
                    content: ['bar'],
                    parentStep: step2
                });

                chai.expect(batch[4]).to.deep.include({
                    type: LogTypes.log,
                    content: ['baz'],
                    parentStep: step1
                });
                callback();
            } catch (e) {
                callback(e);
            }
        });

        loggerClient.step(stepMessage1, async () => {
            loggerClient.log('foo');

            loggerClient.step(stepMessage2, () => {
                loggerClient.log('bar');
            });

            loggerClient.log('baz');
        });
    });

    it('should allow to start and stop steps manually', (callback) => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);

        transport.on(LoggerMessageTypes.REPORT_BATCH, (batch) => {
            try {
                const step1 = batch[0].stepUid;
                const step2 = batch[2].stepUid;

                chai.expect(batch).to.be.an('array').with.length(4);

                chai.expect(batch[0]).to.deep.include({
                    type: LogTypes.step,
                    content: ['step1'],
                    parentStep: null
                });

                chai.expect(batch[1]).to.deep.include({
                    type: LogTypes.log,
                    content: ['foo'],
                    parentStep: step1
                });

                chai.expect(batch[2]).to.deep.include({
                    type: LogTypes.step,
                    content: ['step2'],
                    parentStep: step1
                });

                chai.expect(batch[3]).to.deep.include({
                    type: LogTypes.log,
                    content: ['baz'],
                    parentStep: step2
                });
                callback();
            } catch (e) {
                callback(e);
            }
        });

        loggerClient.startStep('step1');
        loggerClient.log('foo');
        loggerClient.startStep('step2');
        loggerClient.log('baz');
        loggerClient.endStep('step1');
    });

    it('should nest manually started steps', (callback) => {
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);

        transport.on(LoggerMessageTypes.REPORT_BATCH, (batch) => {
            try {
                chai.expect(batch).to.be.an('array').with.length(5);

                chai.expect(batch[0]).to.deep.include({
                    type: LogTypes.step,
                    content: ['step1'],
                    parentStep: null
                });

                const step1 = batch[0].stepUid;

                chai.expect(batch[1]).to.deep.include({
                    type: LogTypes.log,
                    content: ['foo'],
                    parentStep: step1
                });

                chai.expect(batch[2]).to.deep.include({
                    type: LogTypes.step,
                    content: ['step2'],
                    parentStep: step1
                });

                const step2 = batch[2].stepUid;

                chai.expect(batch[3]).to.deep.include({
                    type: LogTypes.log,
                    content: ['bar'],
                    parentStep: step2
                });

                chai.expect(batch[4]).to.deep.include({
                    type: LogTypes.log,
                    content: ['baz'],
                    parentStep: step1
                });
                callback();
            } catch (e) {
                callback(e);
            }
        });

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

        transport.on(LoggerMessageTypes.REPORT_BATCH, () => {
            callback(new Error('batch was sent'));
        });

        loggerClient.endStep();

        setImmediate(() => {
            callback();
        });
    });
});
