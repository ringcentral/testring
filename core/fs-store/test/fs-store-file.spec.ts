/// <reference types="mocha" />

import * as chai from 'chai';

import {loggerClient} from '@testring/logger';

import {FSStoreServer, fsStoreServerHooks} from '../src/fs-store-server';
import {FSStoreFile} from '../src/fs-store-file';

import {fsReqType} from '@testring/types';

const prefix = 'fsf-test';
const log = loggerClient.withPrefix(prefix);
const FSS = new FSStoreServer(10, prefix);

describe('fs-store-file', () => {
    it('store object should lock access & unlink data', async () => {
        const fileName = '/tmp/tmp.tmp';
        const file = new FSStoreFile({
            file: fileName,
            fsStorePrefix: prefix,
        });

        const state = {lock: 0, access: 0, unlink: 0};
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        chai.expect(onRelease).not.to.be.an(
            'undefined',
            'Hook ON_RELEASE in undefined',
        );

        onRelease &&
            onRelease.readHook('testRelease', (readOptions) => {
                const {action} = readOptions;
                const hookfileName = readOptions.fileName;
                log.debug({fileName: hookfileName, action}, 'on release hook');
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
                chai.expect(hookfileName).to.be.a('string');
                log.debug({fileName: hookfileName, state}, 'release hook done');
            });

        try {
            await file.lock();
            state.lock += 1;

            await file.write(Buffer.from('data'));
            state.access += 1;

            await file.append(Buffer.from(' more data'));
            state.access += 1;

            const content = await file.read();
            state.access += 1;
            chai.expect(content.toString()).to.be.equal('data more data');

            const wasUnlocked = await file.unlock();
            chai.expect(wasUnlocked).to.be.equal(true);

            await file.unlink();
            state.unlink += 1;
        } catch (e) {
            log.error(e, 'ERROR during file write test');
            throw e;
        }

        chai.expect(state).to.be.deep.equal({lock: 0, access: 0, unlink: 0});

        return Promise.resolve();
    });
    it('store object should transactional lock access & unlink data', async () => {
        const fileName = '/tmp/tmp_01.tmp';
        const file = new FSStoreFile({
            file: fileName,
            fsStorePrefix: prefix,
        });

        try {
            await file.lock();

            await Promise.all([
                file.transaction(async () => {
                    await file.write(Buffer.from('data'));
                    await file.append(Buffer.from(' more data'));

                    const content = await file.read();
                    chai.expect(content.toString()).to.be.equal(
                        'data more data',
                    );
                }),
                file.transaction(async () => {
                    await file.write(Buffer.from('data02'));
                    await file.append(Buffer.from(' more data02'));

                    const content = await file.read();
                    chai.expect(content.toString()).to.be.equal(
                        'data02 more data02',
                    );
                }),
            ]);

            const wasUnlocked = await file.unlock();
            chai.expect(wasUnlocked).to.be.equal(true);
            await file.unlink();
        } catch (e) {
            log.error(e, 'ERROR during file write test 02');
            throw e;
        }
        return Promise.resolve();
    });
});
