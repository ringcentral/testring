/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import * as sinon from 'sinon';

import { LoggerClient } from '../src/logger-client';
import { LoggerMessageTypes, LogTypes } from '../src/structs';

import { TransportMock } from './transport.mock';
import { report } from './fixtures/constants';

describe('Logger client', () => {
    it('should broadcast messages on log, info, warn and error with level 0 by default', (callback) => {
        const spy = sinon.spy((entry) => {
            chai.expect(entry.level).to.be.equal(0);
        });
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport as any);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);

        setImmediate(() => {
            if (spy.callCount === 4) {
                callback();
            } else {
                callback(new Error(`broadcasted ${spy.callCount} times`));
            }
        });
    });

    it('should allow to set it\'slevel manually and then broadcast it in entries', (callback) => {
        const manualLevel = 1337;
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport as any);

        transport.on(LoggerMessageTypes.REPORT, (entry) => {
            chai.expect(entry).to.have.property('level', manualLevel);
            callback();
        });

        loggerClient.setLogNestingLevel(manualLevel);
        loggerClient.log(...report);
    });

    it('should allow to call log method with level which should not affect client\'s level', (callback) => {
        const forcedLevel = 1337;
        const spy = sinon.spy((entry) => {
            switch (entry.type) {
                case LogTypes.log: {
                    chai.expect(entry).to.have.property('level', forcedLevel);
                    break;
                }
                case LogTypes.info: {
                    chai.expect(entry).to.have.property('level', 0);
                    break;
                }
                default: {
                    callback(new Error(`unexpected log type: ${entry.type}`));
                }
            }
        });
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport as any);

        transport.on(LoggerMessageTypes.REPORT, (entry) => {
            spy(entry);

            if (spy.callCount === 2) {
                callback();
            }
        });

        loggerClient.withLevel(1337).log(...report);
        loggerClient.info(...report);
    });
});
