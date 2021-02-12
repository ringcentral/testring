
'use strict';
import * as chai from 'chai';

import { FSStoreServer, fsStoreServerHooks } from '../src/fs-store-server';
import { FSStoreClient } from '../src/fs-store-client';
import { getNewLog } from '../src/utils';

const logger = getNewLog({ m: 'fsc-test' });

import {
    fsReqType,
} from '@testring/types';

const FSS = new FSStoreServer(10);


describe('fs-store-client', () => {
    it('client should lock access & unlink data', (done) => {

        const FSC = new FSStoreClient();

        const fileName = 'tmp.tmp';

        const state = { lock: 0, access: 0, unlink: 0 };
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        chai.expect(onRelease).not.to.be.an('undefined', 'Hook ON_RELEASE in undefined');

        onRelease && onRelease.readHook('testRelease', ({ fileName, action }) => {
            logger.debug({ fileName, action }, 'on release');
            switch (action) {
                case fsReqType.lock: state.lock -= 1; break;
                case fsReqType.access: state.access -= 1; break;
                case fsReqType.unlink: state.unlink -= 1; break;
            }
            chai.expect(fileName).to.be.a('string');
        });

        const lockReqId = FSC.getLock({ fileName }, (fName) => {
            chai.expect(fileName).to.be.equal(fName);
        });
        state.lock += 1;
        const accessReqId = FSC.getAccess({ fileName }, (fName) => {
            chai.expect(fileName).to.be.equal(fName);
        });
        state.access += 1;
        const unlinkReqId = FSC.getUnlink({ fileName }, (fName) => {
            chai.expect(fileName).to.be.equal(fName);
        });
        state.unlink += 1;
        setTimeout(() => {
            chai.expect(state).to.be.deep.equal({ lock: 1, access: 1, unlink: 1 });

            FSC.release(lockReqId, () => {

            });

            FSC.release(accessReqId, () => {

            });

            FSC.release(unlinkReqId, () => {

            });
            setTimeout(() => {
                chai.expect(state).to.be.deep.equal({ lock: 0, access: 0, unlink: 0 });
                done();

            }, 100);
        }, 100);


    });
});
