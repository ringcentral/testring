/// <reference types="node" />
/// <reference types="mocha" />

import { spawn } from 'child_process';
import * as process from 'process';
import * as path from 'path';
import * as chai from 'chai';
import { CHILD_PROCESS_NAME, REQUEST_NAME, RESPONSE_NAME, PAYLOAD } from './fixtures/constants';
import { Transport } from '../src/transport';

describe('Transport functional test', () => {
    it('should create connection between child and parent process', (callback) => {
        const isWindows = process.platform === 'win32';
        const tsNodePath = path.resolve(__dirname, `../../../node_modules/.bin/ts-node${isWindows ? '.cmd' : ''}`);
        const childEntryPath = path.resolve(__dirname, './fixtures/child.ts');
        const transport = new Transport(process);

        const childProcess = spawn(tsNodePath, [childEntryPath], {
            stdio: transport.getProcessStdioConfig(),
            cwd: process.cwd()
        });

        transport.registerChildProcess(CHILD_PROCESS_NAME, childProcess);

        transport.on(RESPONSE_NAME, (payload) => {
            childProcess.kill();
            childProcess.on('close', () => {
                chai.expect(payload).to.be.deep.equal(PAYLOAD);
                chai.expect(transport.getProcessesList()).to.have.length(0);

                callback();
            });
        });

        transport.send(CHILD_PROCESS_NAME, REQUEST_NAME, null)
            .catch((error) => callback(error));
    });
});
