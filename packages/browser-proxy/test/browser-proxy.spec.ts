/// <reference types="mocha" />
/* eslint sonarjs/no-identical-functions: 0 */

import * as path from 'path';
import * as chai from 'chai';
import {
    BrowserProxyMessageTypes,
    BrowserProxyActions,
    IBrowserProxyCommandResponse,
    IBrowserProxyCommand,
} from '@testring-dev/types';
import {TransportMock} from '@testring-dev/test-utils';
import {BrowserProxy} from '../src/browser-proxy/browser-proxy';

const asyncPluginPath = path.resolve(__dirname, './fixtures/async-plugin.ts');
const pluginPath = path.resolve(__dirname, './fixtures/sync-plugin.ts');
const pluginConfig = {};
const commandMock: IBrowserProxyCommand = {
    action: BrowserProxyActions.click,
    args: ['foo', 'bar'],
};

describe('Browser proxy', () => {
    it('should listen to incoming messages and call onAction hook when gets message', (callback) => {
        const uid = 'testUid';
        const transport = new TransportMock();

        new BrowserProxy(transport, pluginPath, pluginConfig);

        transport.on<IBrowserProxyCommandResponse>(
            BrowserProxyMessageTypes.response,
            (response) => {
                chai.expect(response.uid).to.be.equal(uid);
                chai.expect(response.error).to.be.equal(null);

                callback();
            },
        );

        transport.emit(BrowserProxyMessageTypes.execute, {
            uid,
            applicant: 'test',
            command: commandMock,
        });
    });

    it('should work with async hooks', (callback) => {
        const uid = 'testUid';
        const transport = new TransportMock();
        new BrowserProxy(transport, asyncPluginPath, pluginConfig);

        transport.on<IBrowserProxyCommandResponse>(
            BrowserProxyMessageTypes.response,
            (response) => {
                chai.expect(response.uid).to.be.equal(uid);
                chai.expect(response.error).to.be.equal(null);

                callback();
            },
        );

        transport.emit(BrowserProxyMessageTypes.execute, {
            uid,
            command: commandMock,
        });
    });

    it('should broadcast response with exception if onAction hook fails', (callback) => {
        const uid = 'testUid';
        const transport = new TransportMock();
        new BrowserProxy(transport, pluginPath, pluginConfig);

        transport.on<IBrowserProxyCommandResponse>(
            BrowserProxyMessageTypes.response,
            (response) => {
                chai.expect(response).to.have.property('uid', uid);
                chai.expect(response).to.have.property('error');

                callback();
            },
        );

        transport.emit(BrowserProxyMessageTypes.execute, {
            uid,
            command: {
                action: 'barrelRoll' as BrowserProxyActions,
                arguments: ['foo', 'bar'],
            },
        });
    });
});
