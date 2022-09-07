/// <reference types="mocha" />

import * as chai from 'chai';

import {FSStoreServer, fsStoreServerHooks} from '../src/fs-store-server';
import {FSStoreClient} from '../src/fs-store-client';

import {fsReqType} from '@testring-dev/types';

let FSS: FSStoreServer;

describe('fs-store-client', () => {
    before(() => {
        FSS = new FSStoreServer(10);
    });
    it('client should lock access & unlink data', (done) => {
        const FSC = new FSStoreClient();

        const fileName = 'tmp.tmp';

        const state = {lock: 0, access: 0, unlink: 0};
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        chai.expect(onRelease).not.to.be.an(
            'undefined',
            'Hook ON_RELEASE is undefined',
        );

        onRelease &&
            onRelease.readHook('testRelease', (readOptions) => {
                const {action, ffName} = readOptions;
                switch (action) {
                    case fsReqType.lock:
                        break;
                    case fsReqType.access:
                        state.access -= 1;
                        break;
                    case fsReqType.unlink:
                        state.unlink -= 1;
                        break;
                }
                chai.expect(ffName).to.be.a('string');
            });

        const lockReqId = FSC.getLock({fileName}, (fName) => {
            try {
                chai.expect(fName.includes(fileName)).to.be.equal(true);
            } catch (err) {
                done(err);
            }
            state.lock += 1;
        });
        const accessReqId = FSC.getAccess({fileName}, (fName) => {
            try {
                chai.expect(fName.includes(fileName)).to.be.equal(true);
            } catch (err) {
                done(err);
            }
            state.access += 1;
        });
        const unlinkReqId = FSC.getUnlink({fileName}, (fName) => {
            try {
                chai.expect(fName.includes(fileName)).to.be.equal(true);
            } catch (err) {
                done(err);
            }
        });
        state.unlink += 1;
        setTimeout(() => {
            chai.expect(state).to.be.deep.equal({
                lock: 1,
                access: 1,
                unlink: 1,
            });
            const lockCB = () => {
                state.lock -= 1;
            };

            const lockRelRet = FSC.release(lockReqId, lockCB);
            chai.expect(lockRelRet).to.be.equal(true);

            const accessRelRet = FSC.release(accessReqId);
            chai.expect(accessRelRet).to.be.equal(true);

            const unlinkRelRet = FSC.release(unlinkReqId);
            chai.expect(unlinkRelRet).to.be.equal(true);

            setTimeout(() => {
                chai.expect(state).to.be.deep.equal({
                    lock: 0,
                    access: 0,
                    unlink: 0,
                });
                done();
            }, 200);
        }, 200);
    });
});
