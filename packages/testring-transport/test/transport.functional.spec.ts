/// <reference types="mocha" />

import { fork } from '@testring/child-process';
import * as process from 'process';
import * as path from 'path';
import * as chai from 'chai';
import { CHILD_PROCESS_NAME, REQUEST_NAME, RESPONSE_NAME, PAYLOAD } from './fixtures/constants';
import { Transport } from '../src/transport';

describe('Transport functional test', () => {
    it('should create connection between child and parent process', (callback) => {
        const childEntryPath = path.resolve(__dirname, './fixtures/child.ts');
        const childProcess = fork(childEntryPath);
        const transport = new Transport(process);

        transport.registerChildProcess(CHILD_PROCESS_NAME, childProcess);

        const removeCallback = transport.on(RESPONSE_NAME, (payload) => {
            childProcess.kill();
            childProcess.on('close', () => {
                try {
                    chai.expect(payload).to.be.deep.equal(PAYLOAD);

                    callback();
                } catch (error) {
                    callback(error);
                } finally {
                    removeCallback();
                }
            });
        });

        transport.send(CHILD_PROCESS_NAME, REQUEST_NAME, null)
            .catch((error) => callback(error));
    });

    it('should wipe out children from registry, when it\'s closed', (callback) => {
        const childEntryPath = path.resolve(__dirname, './fixtures/child.ts');
        const childProcess = fork(childEntryPath);
        const transport = new Transport(process);

        transport.registerChildProcess(CHILD_PROCESS_NAME, childProcess);

        chai.expect(transport.getProcessesList()).to.have.length(1);

        childProcess.on('close', () => {
            try {
                chai.expect(transport.getProcessesList()).to.have.length(0);
                callback();
            } catch (error) {
                callback(error);
            }
        });

        childProcess.kill();
    });
});
