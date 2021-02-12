
'use strict';
import * as chai from 'chai';

import { FSStoreServer, fsStoreServerHooks } from '../src/fs-store-server';
import { FSStore } from '../src/fs-store';
import { getNewLog } from '../src/utils';

const logger = getNewLog({ m: 'fsc-test' });

import {
    fsReqType,
} from '@testring/types';

const FSS = new FSStoreServer(10);


describe('fs-store', () => {
    it('store object should lock access & unlink data', async (done) => {

        const fileName = '/tmp/tmp.tmp';
        const file = new FSStore({
            file: fileName,
        });


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

        await file.lock();
        await file.write(Buffer.from('data'));
        await file.append(Buffer.from(' more data'));
        const content = await file.read();
        chai.expect(content.toString()).to.be.equal('data more data');
        await file.unlock();
        await file.unlink();
        done();

        // const lockReqId = FSC.getLock({ fileName }, (fName) => {
        //     chai.expect(fileName).to.be.equal(fName);
        // });
        // state.lock += 1;
        // const accessReqId = FSC.getAccess({ fileName }, (fName) => {
        //     chai.expect(fileName).to.be.equal(fName);
        // });
        // state.access += 1;
        // const unlinkReqId = FSC.getUnlink({ fileName }, (fName) => {
        //     chai.expect(fileName).to.be.equal(fName);
        // });
        // state.unlink += 1;
        // setTimeout(() => {
        //     chai.expect(state).to.be.deep.equal({ lock: 1, access: 1, unlink: 1 });

        //     FSC.release(lockReqId, () => {

        //     });

        //     FSC.release(accessReqId, () => {

        //     });

        //     FSC.release(unlinkReqId, () => {

        //     });
        //     setTimeout(() => {
        //         chai.expect(state).to.be.deep.equal({ lock: 0, access: 0, unlink: 0 });
        //         done();

        //     }, 100);
        // }, 100);


    });
});
