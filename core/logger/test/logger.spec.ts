/// <reference types="mocha" />

import {Writable} from 'stream';
import {LoggerPlugins} from '@testring-dev/types';
import {TransportMock} from '@testring-dev/test-utils';
import {LoggerServer} from '../src/logger-server';
import {LoggerClient} from '../src/logger-client';
import {LOG_ENTITY} from './fixtures/constants';

const DEFAULT_CONFIG: any = {};
const DEFAULT_WRITABLE_CONFIG = {
    write: () => {
        /* empty */
    },
};

describe('Logger', () => {
    it('should relay message from client to server through transport', (callback) => {
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(
            DEFAULT_CONFIG,
            transport,
            stdout,
        );
        const loggerClient = new LoggerClient(transport);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.readHook('testPlugin', () => {
                callback();
            });
        }

        loggerClient.log(LOG_ENTITY);
    });
});
