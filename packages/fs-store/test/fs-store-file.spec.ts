
'use strict';
import * as chai from 'chai';

import { FSStoreServer, fsStoreServerHooks } from '../src/fs-store-server';
import { FSStoreFile } from '../src/fs-store-file';
import { getNewLog } from '../src/utils';

const logger = getNewLog({ m: 'fsf-test' });

import {
    fsReqType,
} from '@testring/types';

const prefix = 'fsf-test';

const FSS = new FSStoreServer(10, prefix);


describe('fs-store-file', () => {
    it('store object should lock access & unlink data', async () => {

        const fileName = '/tmp/tmp.tmp';
        const file = new FSStoreFile({
            file: fileName,
            fsStorePrefix: prefix,
        });


        const state = { lock: 0, access: 0, unlink: 0 };
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        chai.expect(onRelease).not.to.be.an('undefined', 'Hook ON_RELEASE in undefined');

        onRelease && onRelease.readHook('testRelease', ({ fileName, action }) => {
            logger.debug({ fileName, action }, 'on release hook');
            switch (action) {
                case fsReqType.lock: state.lock -= 1; break;
                case fsReqType.access: state.access -= 1; break;
                case fsReqType.unlink: state.unlink -= 1; break;
            }
            chai.expect(fileName).to.be.a('string');
            logger.debug({ fileName, state }, 'release hook done');
        });

        try {
            logger.info('before lock');
            await file.lock();
            state.lock += 1;
            logger.info('after lock');
            await file.write(Buffer.from('data'));
            state.access += 1;
            logger.info('after write');
            await file.append(Buffer.from(' more data'));
            state.access += 1;
            logger.info('after append');
            const content = await file.read();
            state.access += 1;
            chai.expect(content.toString()).to.be.equal('data more data');
            logger.info('after read');
            const wasUnlocked = await file.unlock();
            // state.lock += 1;
            chai.expect(wasUnlocked).to.be.equal(true);
            logger.info('after unlock');
            await file.unlink();
            logger.info('after unlink');
            state.unlink += 1;
        } catch (e) {
            logger.error(e, 'ERROR during file write test');
            throw e;
        }

        chai.expect(state).to.be.deep.equal({ lock: 0, access: 0, unlink: 0 });

        return Promise.resolve();

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
