/// <reference types="node" />
/// <reference types="mocha" />

import { Transport } from '@testring/transport';

import { LoggerServer, LoggerPlugins } from '../src/logger-server';
import { LoggerClient } from '../src/logger-client';
import { LoggerClientLocal } from '../src/logger-client-local';

import { entry } from './fixtures/constants';

import { TransportMock } from './transport.mock';

const DEFAULT_CONFIG: any = {
    silent: false
};

describe('Logger', () => {
    it('should relay message from client to server through transport', (callback) => {
        const transport = new TransportMock();
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport as any, process.stdout as any);
        const loggerClient = new LoggerClient(transport as any);
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
            const transport = new Transport();
            const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport,  process.stdout as any);
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
