/// <reference types="mocha" />
/* eslint sonarjs/no-identical-functions: 0 */

import * as chai from 'chai';
import {ITransportMessage} from '@testring/types';
import {ChildProcessMock} from './child-process.mock';
import {RootProcessMock} from './root-process.mock';
import {serialize} from '../src/serialize';
import {Transport} from '../src/transport';

describe('Transport', () => {
    context('child process message sending', () => {
        const MESSAGE_TYPE = 'randomModuleName';

        it('should get response', async () => {
            const childProcess = new ChildProcessMock();
            const transport = new Transport();

            transport.registerChild('test', childProcess as any);

            await transport.send('test', MESSAGE_TYPE, []);
        });

        it('should correctly fail if there is no such process', (callback) => {
            const transport = new Transport();

            transport
                .send('unexpectedName', MESSAGE_TYPE, [])
                .then(() => {
                    callback(
                        'Message was sended to nonexistent process somehow',
                    );
                })
                .catch((exception) => {
                    chai.expect(exception).to.be.an.instanceof(ReferenceError);
                    callback();
                })
                .catch((exception) => {
                    callback(exception);
                });
        });

        it('should correctly fail, when process fails', (callback) => {
            const childProcessMock = new ChildProcessMock(true);
            const transport = new Transport();

            transport.registerChild('test', childProcessMock as any);
            transport
                .send('unexpectedName', MESSAGE_TYPE, [])
                .then(() => {
                    callback('Message was sended to failed process somehow');
                })
                .catch(() => {
                    callback();
                })
                .catch((exception) => {
                    callback(exception);
                });
        });
    });

    context('root process broadcasting', () => {
        it('should send message to process', () => {
            const rootProcessMock = new RootProcessMock();
            const transport = new Transport(rootProcessMock as any);
            const payload = {};

            transport.broadcast('message', payload);

            chai.expect(rootProcessMock.$callCount()).to.be.equal(1);
            chai.expect(rootProcessMock.$lastCall().payload).to.be.deep.equal(
                serialize(payload),
            );
        });
    });

    context('message handling', () => {
        it('should subscribe message from broadcast', (callback) => {
            const messageType = 'test';
            const expectedPayload = {};
            const rootProcessMock = new RootProcessMock();
            const transport = new Transport(rootProcessMock as any);

            const removeListener = transport.on(messageType, (payload) => {
                removeListener();

                chai.expect(payload).to.be.equal(expectedPayload);

                callback();
            });

            rootProcessMock.$triggerListener<ITransportMessage>({
                type: messageType,
                payload: expectedPayload,
            });
        });

        it('should subscribe message from broadcast', (callback) => {
            const messageType = 'test';
            const expectedPayload = {};
            const childProcessMock = new ChildProcessMock();

            const transport = new Transport();

            transport.registerChild('test', childProcessMock as any);

            const removeListener = transport.on(messageType, (payload) => {
                removeListener();

                chai.expect(payload).to.be.equal(expectedPayload);

                callback();
            });

            childProcessMock.$triggerListener<ITransportMessage>({
                type: messageType,
                payload: expectedPayload,
            });
        });
    });
});
