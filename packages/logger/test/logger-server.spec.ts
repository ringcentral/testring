/// <reference types="mocha" />

import { Writable } from 'stream';
import * as sinon from 'sinon';
import * as chai from 'chai';
import { TransportMock } from '@testring/test-utils';
import { LoggerMessageTypes, LogLevel, LogTypes, LoggerPlugins } from '@testring/types';
import { LOG_ENTITY } from './fixtures/constants';
import { voidLogger } from './fixtures/voidLogger';
import { LoggerServer } from '../src/logger-server';

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
            ...LOG_ENTITY,
            type: LogTypes.error
        };

        if (beforeLog && onLog) {
            beforeLog.writeHook('testPlugin', async (entryBeforeTransform) => {
                chai.expect(entryBeforeTransform).to.be.deep.equal(LOG_ENTITY);

                return alteredEntry;
            });

            onLog.readHook('testPlugin', (entry) => {
                chai.expect(entry).to.be.deep.equal(alteredEntry);

                callback();
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT, LOG_ENTITY);
    });

    it('should call onError hook when fail to log report', (callback) => {
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout, 0, true);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);
        const onError = loggerServer.getHook(LoggerPlugins.onError);

        if (onLog && onError) {
            onLog.readHook('testPlugin', () => {
                throw new Error('WHOOPS!');
            });

            onError.readHook('testPlugin', () => {
                callback();
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT, LOG_ENTITY);
    });

    it('should retry 1 time then log successfully', (callback) => {
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout, 1);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        const errorSpy = sinon.spy();
        const logHandler = voidLogger(1, true, errorSpy, () => {
            chai.expect(errorSpy.callCount).to.be.equal(1);

            callback();
        });

        if (onLog) {
            onLog.readHook('testPlugin', logHandler);
        }

        transport.broadcast(LoggerMessageTypes.REPORT, LOG_ENTITY);
    });

    it('should skip one entry then successfully log one', (callback) => {
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout, 0, true);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        const successEntry = {
            ...LOG_ENTITY,
            type: LogTypes.error
        };

        const errorSpy = sinon.spy();
        const logHandler = voidLogger(1, true, errorSpy, (entry) => {
            chai.expect(errorSpy.callCount).to.be.equal(1);
            chai.expect(entry).to.be.deep.equal(successEntry);

            callback();
        });

        if (onLog) {
            onLog.readHook('testPlugin', logHandler);
        }

        transport.broadcast(LoggerMessageTypes.REPORT, LOG_ENTITY); // this one should fail
        transport.broadcast(LoggerMessageTypes.REPORT, successEntry); // this one should succeed
    });

    it('should accept batch reports from logger clients, and pass individual entries to queue', (callback) => {
        const spy = sinon.spy();
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.readHook('testPlugin', () => {
                spy();

                if (spy.callCount === 5) {
                    callback();
                } else if (spy.callCount > 5) {
                    callback(`hook called ${spy.callCount} times`);
                }
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT_BATCH, [
            LOG_ENTITY, LOG_ENTITY, LOG_ENTITY, LOG_ENTITY, LOG_ENTITY
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
            onLog.readHook('testPlugin', () => {
                callback('hook called');
            });
        }

        transport.broadcast(LoggerMessageTypes.REPORT, LOG_ENTITY);

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
            onLog.readHook('testPlugin', () => {
                callback('hook called');
            });
        }

        transport.broadcast(
            LoggerMessageTypes.REPORT,
            {
                ...LOG_ENTITY,
                logLevel: LogLevel.verbose
            }
        );

        setTimeout(() => {
            callback();
        }, 0);
    });
});
