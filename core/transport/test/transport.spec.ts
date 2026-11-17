/// <reference types="mocha" />
/* eslint sonarjs/no-identical-functions: 0 */

import * as chai from 'chai';
import sinon from 'sinon';
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
            const childProcessMock = new ChildProcessMock({
                sendError: new Error('Some error happened'),
            });
            const transport = new Transport();

            transport.registerChild('test', childProcessMock as any);
            transport
                .send('test', MESSAGE_TYPE, [])
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

        it('should resolve only after the intended child acknowledges', async () => {
            const child = new ChildProcessMock({acknowledge: false});
            const wrongChild = new ChildProcessMock({acknowledge: false});
            const transport = new Transport();
            transport.registerChild('worker-1', child as any);
            transport.registerChild('worker-2', wrongChild as any);

            let settled = false;
            const delivery = transport
                .send('worker-1', MESSAGE_TYPE, [])
                .then(() => (settled = true));
            const uid = child.$messages()[0]?.uid;
            chai.expect(uid).to.be.a('string');
            wrongChild.$acknowledge(uid);
            await Promise.resolve();
            chai.expect(settled).to.equal(false);

            child.$acknowledge(uid);
            await delivery;
            chai.expect(settled).to.equal(true);
        });

        it('should reject every pending delivery for the exact child that exits', async () => {
            const child = new ChildProcessMock({acknowledge: false});
            const prefixChild = new ChildProcessMock({acknowledge: false});
            const transport = new Transport();
            transport.registerChild('worker-1', child as any);
            transport.registerChild('worker-10', prefixChild as any);

            const exited = [
                transport.send('worker-1', 'first', null),
                transport.send('worker-1', 'second', null),
            ];
            const unaffected = transport.send('worker-10', 'third', null);
            child.$exit();
            prefixChild.$acknowledge();

            const results = await Promise.allSettled([...exited, unaffected]);
            chai.expect(results.map(({status}) => status)).to.deep.equal([
                'rejected',
                'rejected',
                'fulfilled',
            ]);
        });

        it('should reject after five seconds and ignore a late acknowledgement', async () => {
            const clock = sinon.useFakeTimers();
            try {
                const child = new ChildProcessMock({acknowledge: false});
                const transport = new Transport();
                transport.registerChild('worker-1', child as any);

                const delivery = transport.send('worker-1', MESSAGE_TYPE, []);
                const resultPromise = Promise.allSettled([delivery]);
                await clock.tickAsync(5000);
                const [result] = await resultPromise;
                chai.expect(result?.status).to.equal('rejected');

                child.$acknowledge();
                await clock.tickAsync(1);
                chai.expect(result?.status).to.equal('rejected');
            } finally {
                clock.restore();
            }
        });

        it('should reject a synchronous send throw', async () => {
            const child = new ChildProcessMock({
                throwError: new Error('send threw'),
            });
            const transport = new Transport();
            transport.registerChild('test', child as any);

            const [result] = await Promise.allSettled([
                transport.send('test', MESSAGE_TYPE, []),
            ]);
            chai.expect(result?.status).to.equal('rejected');
        });

        it('should reject unsupported payloads before sending', async () => {
            const child = new ChildProcessMock();
            const transport = new Transport();
            transport.registerChild('test', child as any);

            const [result] = await Promise.allSettled([
                transport.send('test', MESSAGE_TYPE, new Map()),
            ]);

            chai.expect(result?.status).to.equal('rejected');
            chai.expect(child.$messages()).to.have.lengthOf(0);
        });
    });

    context('root process broadcasting', () => {
        it('should send message to process', () => {
            const rootProcessMock = new RootProcessMock();
            const transport = new Transport(rootProcessMock as any);
            const payload = {};

            transport.broadcast('message', payload);

            chai.expect(rootProcessMock.$callCount()).to.be.equal(1);
            chai.expect(rootProcessMock.$lastCall()).to.have.property('payload').that.deep.equals(
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
