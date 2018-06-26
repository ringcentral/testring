/// <reference types="node" />
/// <reference types="mocha" />
import { Writable } from 'stream';
import { Transport } from '@testring/transport';

import { LoggerServer, LoggerPlugins } from '../src/logger-server';
import { LoggerClient } from '../src/logger-client';
import { LoggerClientLocal } from '../src/logger-client-local';

import { entry } from './fixtures/constants';

import { TransportMock } from './transport.mock';


const DEFAULT_CONFIG: any = {};

describe('Logger', () => {
    it('should relay message from client to server through transport', (callback) => {
        const transport = new TransportMock();
        const stdout = new Writable({write: ()=>{}});
        const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport as any, stdout);
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
            const stdout = new Writable({write: ()=>{}});
            const loggerServer = new LoggerServer(DEFAULT_CONFIG, transport,  stdout);
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
