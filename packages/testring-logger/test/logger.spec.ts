/// <reference types="node" />
/// <reference types="mocha" />

import { Writable } from 'stream';
import { LoggerPlugins } from '@testring/types';
import { TransportMock } from '@testring/test-utils';
import { LoggerServer } from '../src/logger-server';
import { LoggerClient } from '../src/logger-client';
import { LoggerClientLocal } from '../src/logger-client-local';
import { entry } from './fixtures/constants';

const DEFAULT_CONFIG: any = {};
const DEFAULT_WRITABLE_CONFIG = {
    write: () => {
    }
};

describe('Logger', () => {
    it('should relay message from client to server through transport', (callback) => {
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout);
        const loggerClient = new LoggerClient(transport);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.tap('testPlugin', () => {
                callback();
            });
        }

        loggerClient.log(entry);
    });

    context('with server and local client on same process', () => {
        it('should relay message from client to server through transport', (callback) => {
            const transport = new TransportMock();
            const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
            const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport, stdout);
            const loggerClient = new LoggerClientLocal(transport);
            const onLog = loggerServer.getHook(LoggerPlugins.onLog);

            if (onLog) {
                onLog.tap('testPlugin', () => {
                    callback();
                });
            }

            loggerClient.log(entry);
        });
    });
});
