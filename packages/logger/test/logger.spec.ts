/// <reference types="mocha" />

import { LoggerPlugins } from '@testring/types';
import { TransportMock } from '@testring/test-utils';
import { LoggerServer } from '../src/logger-server';
import { LoggerClient } from '../src/logger-client';
import { LOG_ENTITY } from './fixtures/constants';

const DEFAULT_CONFIG: any = {};

describe('Logger', () => {
    it('should relay message from client to server through transport', (callback) => {
        const transport = new TransportMock();
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport);
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
