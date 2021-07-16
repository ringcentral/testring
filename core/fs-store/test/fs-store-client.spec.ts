/// <reference types="mocha" />

import * as chai from 'chai';

import {FSStoreServer, fsStoreServerHooks} from '../src/fs-store-server';
import {FSStoreClient} from '../src/fs-store-client';

import {fsReqType} from '@testring/types';
import {loggerClient} from '@testring/logger';

const log = loggerClient.withPrefix('fsc-test');

const FSS = new FSStoreServer(10);

describe('fs-store-client', () => {
    it('client should lock access & unlink data', (done) => {
        const FSC = new FSStoreClient();

        const fileName = 'tmp.tmp';

        const state = {lock: 0, access: 0, unlink: 0};
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        chai.expect(onRelease).not.to.be.an(
            'undefined',
            'Hook ON_RELEASE in undefined',
        );

        onRelease &&
            onRelease.readHook('testRelease', (readOptions) => {
                const {action} = readOptions;
                const hookFileName = readOptions.fileName;
                log.debug({fileName: hookFileName, action}, 'on release');
                switch (action) {
                    case fsReqType.lock:
                        state.lock -= 1;
                        break;
                    case fsReqType.access:
                        state.access -= 1;
                        break;
                    case fsReqType.unlink:
                        state.unlink -= 1;
                        break;
                }
                chai.expect(hookFileName).to.be.a('string');
            });

        const lockReqId = FSC.getLock({fileName}, (fName) => {
            chai.expect(fileName).to.be.equal(fName);
        });
        state.lock += 1;
        const accessReqId = FSC.getAccess({fileName}, (fName) => {
            chai.expect(fileName).to.be.equal(fName);
        });
        state.access += 1;
        const unlinkReqId = FSC.getUnlink({fileName}, (fName) => {
            chai.expect(fileName).to.be.equal(fName);
        });
        state.unlink += 1;
        setTimeout(() => {
            chai.expect(state).to.be.deep.equal({
                lock: 1,
                access: 1,
                unlink: 1,
            });
            const emptyFn = () => {
                /* empty */
            };
            FSC.release(lockReqId, emptyFn);

            FSC.release(accessReqId, emptyFn);

            FSC.release(unlinkReqId, emptyFn);
            setTimeout(() => {
                chai.expect(state).to.be.deep.equal({
                    lock: 0,
                    access: 0,
                    unlink: 0,
                });
                done();
            }, 100);
        }, 100);
    });
});
