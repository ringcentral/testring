/// <reference types="mocha" />

import * as chai from 'chai';
import * as sinon from 'sinon';

import { TransportMock } from '@testring/test-utils';
import { LoggerMessageTypes, LogTypes, FSFileLogType } from '@testring/types';

import { LoggerClient } from '../src/logger-client';
import { report, stepsTypes } from './fixtures/constants';

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
        loggerClient.success(...report);
        loggerClient.verbose(...report);
        loggerClient.file('README.md', { type: FSFileLogType.SCREENSHOT });

        chai.expect(spy.callCount).to.be.equal(8);

        for (let i = 0, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].prefix).to.be.equal(null);
        }
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
        loggerClient.success(...report);
        loggerClient.verbose(...report);
        loggerClient.file('README.md', { type: FSFileLogType.SCREENSHOT });

        chai.expect(spy.callCount).to.be.equal(8);

        for (let i = 0, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].prefix).to.be.equal(PREFIX);
        }
    });

    it('should broadcast messages log, info, warn, error and debug from generated logger', () => {
        const PREFIX = 'addingPrefix';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport);
        const loggerClient = loggerParent.withPrefix(PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);
        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);

        chai.expect(spy.callCount).to.be.equal(7);

        for (let i = 0, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].prefix).to.be.equal(PREFIX);
        }
    });

    it('should broadcast messages log, info, warn, error and debug from generated logger saving prefix', () => {
        const PREFIX = 'savingPrefix';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport, PREFIX);
        const loggerClient = loggerParent.createNewLogger();

        transport.on(LoggerMessageTypes.REPORT, spy);
        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);

        chai.expect(spy.callCount).to.be.equal(7);

        for (let i = 0, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].prefix).to.be.equal(PREFIX);
        }
    });

    it('should open multiple inherited steps with sync startStep', () => {
        const PREFIX = 'savingPrefix';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);
        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.startStepLog('log');
        loggerClient.startStepInfo('info');
        loggerClient.startStepDebug('debug');
        loggerClient.startStepSuccess('success');
        loggerClient.startStepWarning('warning');
        loggerClient.startStepError('error');
        loggerClient.log(...report);

        chai.expect(spy.callCount).to.be.equal(7);

        chai.expect(spy.getCall(0).args[0].parentStep).to.be.equal(null);
        chai.expect(spy.getCall(0).args[0]).to.deep.include(stepsTypes[0]);

        for (let i = 1, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].parentStep).to.be.equal(spy.getCall(i - 1).args[0].stepUid);
            chai.expect(spy.getCall(i).args[0]).to.deep.include(stepsTypes[i]);
        }
    });


    it('should open multiple inherited steps with async step', async () => {
        const PREFIX = 'savingPrefix';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);
        transport.on(LoggerMessageTypes.REPORT, spy);

        await loggerClient.stepLog('log', async () => {
            await loggerClient.stepInfo('info', async () => {
                await loggerClient.stepDebug('debug', async () => {
                    await loggerClient.stepSuccess('success', async () => {
                        await loggerClient.stepWarning('warning', async () => {
                            await loggerClient.stepError('error', async () => {
                                loggerClient.log(...report);
                            });
                        });
                    });
                });
            });
        });

        chai.expect(spy.callCount).to.be.equal(7);

        chai.expect(spy.getCall(0).args[0].parentStep).to.be.equal(null);
        chai.expect(spy.getCall(0).args[0]).to.deep.include(stepsTypes[0]);

        for (let i = 1, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].parentStep).to.be.equal(spy.getCall(i - 1).args[0].stepUid);
            chai.expect(spy.getCall(i).args[0]).to.deep.include(stepsTypes[i]);
        }
    });

    it('should not be inherited', async () => {
        const PREFIX = 'savingPrefix';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);
        transport.on(LoggerMessageTypes.REPORT, spy);

        try {
            await loggerClient.stepLog('log', () => {
                throw TypeError('Preventing');
            });
        } catch (err) {
            chai.expect(err).to.be.instanceOf(TypeError);
            chai.expect(err.message).to.be.equal('Preventing');
        }

        loggerClient.log(...report);

        chai.expect(spy.callCount).to.be.equal(2);

        chai.expect(spy.getCall(0).args[0].parentStep).to.be.equal(null);
        chai.expect(spy.getCall(1).args[0]).to.deep.include({
            content: report,
            type: LogTypes.log,
            parentStep: null,
        });
    });

    it('should not be inherited with async callback', async () => {
        const PREFIX = 'savingPrefix';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);
        transport.on(LoggerMessageTypes.REPORT, spy);

        try {
            await loggerClient.stepLog('log', async () => {
                await loggerClient.stepInfo('info', async () => {
                    throw TypeError('Preventing');
                });
            });
        } catch (err) {
            chai.expect(err).to.be.instanceOf(TypeError);
            chai.expect(err.message).to.be.equal('Preventing');
        }

        loggerClient.log(...report);

        chai.expect(spy.callCount).to.be.equal(3);

        chai.expect(spy.getCall(0).args[0].parentStep).to.be.equal(null);
        chai.expect(spy.getCall(1).args[0].parentStep).to.be.equal(spy.getCall(0).args[0].stepUid);
        chai.expect(spy.getCall(2).args[0]).to.deep.include({
            content: report,
            type: LogTypes.log,
            parentStep: null,
        });
    });

    it('should close one step by message', async () => {
        const PREFIX = 'savingPrefixWithSteps';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.startStep('start1');
        loggerClient.startStep('start2');
        loggerClient.endStep('start2');
        loggerClient.log(...report);

        chai.expect(spy.callCount).to.be.equal(3);

        chai.expect(spy.getCall(0).args[0]).to.deep.include({
            content: ['start1'],
            type: LogTypes.step,
            parentStep: null,
        });

        chai.expect(spy.getCall(1).args[0]).to.deep.include({
            content: ['start2'],
            type: LogTypes.step,
            parentStep: spy.getCall(0).args[0].stepUid,
        });

        chai.expect(spy.getCall(2).args[0]).to.deep.include({
            content: report,
            type: LogTypes.log,
            parentStep: spy.getCall(0).args[0].stepUid,
        });
    });

    it('should close started all steps', async () => {
        const PREFIX = 'savingPrefixWithSteps';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.startStep('start1');
        loggerClient.startStep('start2');
        loggerClient.endStep();
        loggerClient.log(...report);

        chai.expect(spy.callCount).to.be.equal(3);

        chai.expect(spy.getCall(0).args[0]).to.deep.include({
            content: ['start1'],
            type: LogTypes.step,
            parentStep: null,
        });

        chai.expect(spy.getCall(1).args[0]).to.deep.include({
            content: ['start2'],
            type: LogTypes.step,
            parentStep: spy.getCall(0).args[0].stepUid,
        });

        chai.expect(spy.getCall(2).args[0]).to.deep.include({
            content: report,
            type: LogTypes.log,
            parentStep: null,
        });
    });

    it('should broadcast messages from different instances but with saving levels', async () => {
        const PREFIX = 'savingPrefixWithSteps';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport, PREFIX);
        const loggerClient = loggerParent.withPrefix(PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);

        await loggerParent.step('start step', () => {
            loggerClient.log(...report);
            loggerParent.info(...report);
        });

        loggerClient.warn(...report);
        loggerParent.error(...report);

        await loggerClient.step('start second step', async () => {
            loggerClient.debug(...report);
            loggerParent.verbose(...report);
        });

        chai.expect(spy.callCount).to.be.equal(8);

        for (let i = 0, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].prefix).to.be.equal(PREFIX);
        }

        chai.expect(spy.getCall(0).args[0]).to.deep.include({
            content: ['start step'],
            type: LogTypes.step,
            parentStep: null,
        });
        chai.expect(spy.getCall(1).args[0]).to.deep.include({
            content: report,
            type: LogTypes.log,
            parentStep: spy.getCall(0).args[0].stepUid,
        });
        chai.expect(spy.getCall(2).args[0]).to.deep.include({
            content: report,
            type: LogTypes.info,
            parentStep: spy.getCall(0).args[0].stepUid,
        });

        chai.expect(spy.getCall(3).args[0]).to.deep.include({
            content: report,
            type: LogTypes.warning,
            parentStep: null,
        });
        chai.expect(spy.getCall(4).args[0]).to.deep.include({
            content: report,
            type: LogTypes.error,
            parentStep: null,
        });

        chai.expect(spy.getCall(5).args[0]).to.deep.include({
            content: ['start second step'],
            type: LogTypes.step,
            parentStep: null,
        });
        chai.expect(spy.getCall(6).args[0]).to.deep.include({
            content: report,
            type: LogTypes.debug,
            parentStep: spy.getCall(5).args[0].stepUid,
        });
        chai.expect(spy.getCall(7).args[0]).to.deep.include({
            content: report,
            type: LogTypes.debug,
            parentStep: spy.getCall(5).args[0].stepUid,
        });
    });

    it('should broadcast messages with marker', async () => {
        const MARKER = 1;
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport);
        const loggerClient = loggerParent.withMarker(MARKER);

        transport.on(LoggerMessageTypes.REPORT, spy);
        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);

        chai.expect(spy.callCount).to.be.equal(7);

        for (let i = 0, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].marker).to.be.equal(MARKER);
        }
    });

    it('should broadcast messages with marker override marker', async () => {
        const MARKER = 1;
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport, null, MARKER);
        const loggerClient = loggerParent.withMarker(null);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerParent.log(...report);
        loggerParent.info(...report);
        loggerParent.warn(...report);
        loggerParent.error(...report);
        loggerParent.debug(...report);
        loggerParent.success(...report);
        loggerParent.verbose(...report);

        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);

        chai.expect(spy.callCount).to.be.equal(14);

        for (let i = 0, len = spy.callCount / 2; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].marker).to.be.equal(MARKER);
        }

        for (let i = spy.callCount / 2, len = spy.callCount; i < len; i++) {
            chai.expect(spy.getCall(i).args[0].marker).to.be.equal(null);
        }
    });
});
