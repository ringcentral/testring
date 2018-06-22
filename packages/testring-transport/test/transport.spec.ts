/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import { ChildProcessMock } from './child-process.mock';
import { RootProcessMock } from './root-process.mock';
import { serialize } from '../src/serialize';
import { Transport } from '../src/transport';

describe('Transport', () => {
    context('child process message sending', () => {
        const MESSAGE_TYPE = 'randomModuleName';

        it('should get response', async () => {
            const transport = new Transport();
            const childProcess = new ChildProcessMock();

            transport.registerChildProcess('test', childProcess as any);

            await transport.send('test', MESSAGE_TYPE, []);
        });

        it('should correctly fail if there is no such process',  (callback) => {
            const transport = new Transport();

            transport.send('unexpectedName', MESSAGE_TYPE, [])
                .then(() => {
                    callback('Message was sended to nonexistent process somehow');
                })
                .catch((exception) => {
                    chai.expect(exception).to.be.an.instanceof(ReferenceError);
                    callback();
                })
                .catch((exception) => {
                    callback(exception);
                });
        });

        it('should correctly fail, when process fails',  (callback) => {
            const transport = new Transport();
            const childProcess = new ChildProcessMock(true);

            transport.registerChildProcess('test', childProcess as any);
            transport.send('unexpectedName', MESSAGE_TYPE, [])
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
            const rootProcess = new RootProcessMock();
            const transport = new Transport(rootProcess as any);
            const payload = {};

            transport.broadcast('message', payload);

            chai.expect(rootProcess.$callCount()).to.be.equal(1);
            chai.expect(rootProcess.$lastCall().payload).to.be.deep.equal(serialize(payload));
        });
    });
});
