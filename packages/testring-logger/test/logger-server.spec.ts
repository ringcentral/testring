/// <reference types="node" />
/// <reference types="mocha" />

import * as sinon from 'sinon';
import * as chai from 'chai';

import { LoggerServer, LoggerPlugins } from '../src/logger-server';
import { LoggerMessageTypes, LogTypes } from '../src/structs';

import { entry } from './fixtures/constants';
import { voidLogger } from './fixtures/voidLogger';

import { TransportMock } from './transport.mock';

const DEFAULT_CONFIG: any = {
    silent: false
};

describe('Logger Server', () => {
    it('should call beforeLog hook and pass transformed entry to log', (callback) => {
        const transport = new TransportMock();
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport as any, process.stdout as any);
        const beforeLog = loggerServer.getHook(LoggerPlugins.beforeLog);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        const alteredEntry = {
            ...entry,
            type: LogTypes.error,
        };

        if (beforeLog && onLog) {
            beforeLog.tapPromise('testPlugin', async (entryBeforeTransform) => {
                chai.expect(entryBeforeTransform).to.be.deep.equal(entry);

                return alteredEntry;
            });

            onLog.tapPromise('testPlugin', async (entry) => {
                chai.expect(entry).to.be.deep.equal(alteredEntry);

                callback();
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT, entry);
    });

    it('should call onError hook when fail to log report', (callback) => {
        const transport = new TransportMock();
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport as any, process.stdout as any, 0, true);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);
        const onError = loggerServer.getHook(LoggerPlugins.onError);

        if (onLog && onError) {
            onLog.tap('testPlugin', () => {
                throw new Error('WHOOPS!');
            });

            onError.tap('testPlugin', () => {
                callback();
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT, entry);
    });

    it('should retry 1 time then log successfully', (callback) => {
        const errorSpy = sinon.spy();
        const logHandler = voidLogger(1, true, errorSpy, () => {
            chai.expect(errorSpy.callCount).to.be.equal(1);

            callback();
        });
        const transport = new TransportMock();
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport as any, process.stdout as any, 1);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.tap('testPlugin', logHandler);
        }

        transport.broadcast(LoggerMessageTypes.REPORT, entry);
    });

    it('should skip one entry then successfully log one', (callback) => {
        const successEntry = {
            ...entry,
            type: LogTypes.error,
        };
        const errorSpy = sinon.spy();
        const logHandler = voidLogger(1, true, errorSpy, (entry) => {
            chai.expect(errorSpy.callCount).to.be.equal(1);
            chai.expect(entry).to.be.deep.equal(successEntry);

            callback();
        });
        const transport = new TransportMock();
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport as any, process.stdout as any, 0, true);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.tap('testPlugin', logHandler);
        }

        transport.broadcast(LoggerMessageTypes.REPORT, entry); // this one should fail
        transport.broadcast(LoggerMessageTypes.REPORT, successEntry); // this one should succeed
    });

    it('should abort after log fail', (callback) => {
        const transport = new TransportMock();
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport as any,  process.stdout as any);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            process.prependOnceListener('unhandledRejection', () => {
                callback();
            });

            onLog.tap('testPlugin', () => {
                throw new Error('NOPE');
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT, entry);
        transport.broadcast(LoggerMessageTypes.REPORT, entry);
    });
});
