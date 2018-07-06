/// <reference types="mocha" />

import { Writable } from 'stream';
import * as sinon from 'sinon';
import * as chai from 'chai';
import { TransportMock } from '@testring/test-utils';
import { LoggerMessageTypes, LogLevel, LogTypes, LoggerPlugins } from '@testring/types';
import { LoggerServer } from '../src/logger-server';
import { entry } from './fixtures/constants';
import { voidLogger } from './fixtures/voidLogger';

const DEFAULT_CONFIG: any = {};
const DEFAULT_WRITABLE_CONFIG = {
    write: () => {
    }
};

describe('Logger Server', () => {
    it('should call beforeLog hook and pass transformed entry to log', (callback) => {
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout);
        const beforeLog = loggerServer.getHook(LoggerPlugins.beforeLog);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        const alteredEntry = {
            ...entry,
            type: LogTypes.error
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
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout, 0, true);
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
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout, 1);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.tap('testPlugin', logHandler);
        }

        transport.broadcast(LoggerMessageTypes.REPORT, entry);
    });

    it('should skip one entry then successfully log one', (callback) => {
        const successEntry = {
            ...entry,
            type: LogTypes.error
        };
        const errorSpy = sinon.spy();
        const logHandler = voidLogger(1, true, errorSpy, (entry) => {
            chai.expect(errorSpy.callCount).to.be.equal(1);
            chai.expect(entry).to.be.deep.equal(successEntry);

            callback();
        });
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout, 0, true);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.tap('testPlugin', logHandler);
        }

        transport.broadcast(LoggerMessageTypes.REPORT, entry); // this one should fail
        transport.broadcast(LoggerMessageTypes.REPORT, successEntry); // this one should succeed
    });

    it('should abort after log fail', (callback) => {
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout);
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

    it('should accept batch reports from logger clients, and pass individual entries to queue', (callback) => {
        const spy = sinon.spy();
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.tap('testPlugin', () => {
                spy();

                if (spy.callCount === 5) {
                    callback();
                } else if (spy.callCount > 5) {
                    callback(`hook called ${spy.callCount} times`);
                }
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT_BATCH, [
            entry, entry, entry, entry, entry
        ]);
    });

    it('should not call onLog hook if config.silent is true', (callback) => {
        const config = {
            ...DEFAULT_CONFIG,
            silent: true
        };
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(config, transport, stdout);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.tap('testPlugin', () => {
                callback('hook called');
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT, entry);

        setTimeout(() => {
            callback();
        }, 0);
    });

    it('should not call onLog hook if config.loggerLevel is greater than entry.logLevel', (callback) => {
        const config = {
            ...DEFAULT_CONFIG,
            logLevel: LogLevel.debug
        };
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(config, transport, stdout);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.tap('testPlugin', () => {
                callback('hook called');
            });
        }

        transport.broadcast(
            LoggerMessageTypes.REPORT,
            {
                ...entry,
                logLevel: LogLevel.verbose
            }
        );

        setTimeout(() => {
            callback();
        }, 0);
    });
});
