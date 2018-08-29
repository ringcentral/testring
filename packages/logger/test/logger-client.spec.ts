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
        loggerClient.success(...report);
        loggerClient.verbose(...report);
        loggerClient.media('filename', Buffer.from('file'));

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
        loggerClient.media('filename', Buffer.from('file'));

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
        const loggerClient = loggerParent.getLogger(PREFIX);

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
        const loggerClient = loggerParent.getLogger();

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

    it('should broadcast messages from different instances but with saving levels', async () => {
        const PREFIX = 'savingPrefixWithSteps';
        const spy = sinon.spy();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport, PREFIX);
        const loggerClient = loggerParent.getLogger();

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
});
