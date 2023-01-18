/// <reference types="mocha" />

import * as fs from 'fs';
import * as path from 'path';
import * as chai from 'chai';

import {loggerClient} from '@testring/logger';

import {FSStoreServer, fsStoreServerHooks} from '../src/fs-store-server';
import {FSTextFactory} from '../src/';

import {fsReqType} from '@testring/types';

const prefix = 'fsf-preset-test';
const log = loggerClient.withPrefix(prefix);
let FSS: FSStoreServer;

const tmpDir = 'tmp';

describe('fs-store-presets', () => {
    before(() => {
        FSS = new FSStoreServer(10, prefix);
    });
    after(() => {
        return fs.promises.rm(tmpDir, {recursive: true});
    });

    it('store object create random file', async () => {
        const onFileName = FSS.getHook(fsStoreServerHooks.ON_FILENAME);

        chai.expect(onFileName).not.to.be.an(
            'undefined',
            'Hook ON_RELEASE in undefined',
        );

        onFileName &&
            onFileName.writeHook('testFileName', (value: string, opts: any) => {
                const {
                    meta: {fileName, ext},
                } = opts;

                if (!fileName) {
                    return path.join(tmpDir, `${Date.now()}.${ext || 'tmp'}`);
                }
                return path.join(tmpDir, fileName);
            });
        const file = FSTextFactory(
            {},
            {
                fsStorePrefix: prefix,
            },
        );

        const str = 'qwerty';

        await file.write(Buffer.from(str));
        const data = (await file.read()).toString();

        chai.expect(data).to.be.equal(str);

        return file.unlink();
    });
    it('store object should lock access & unlink data', async () => {
        const fileName = 'tmp.tmp';
        const file = FSTextFactory(
            {fileName},
            {
                fsStorePrefix: prefix,
            },
        );

        const state = {lock: 0, access: 0, unlink: 0};
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        chai.expect(onRelease).not.to.be.an(
            'undefined',
            'Hook ON_RELEASE in undefined',
        );

        onRelease &&
            onRelease.readHook('testRelease', (readOptions) => {
                const {action, ffName} = readOptions;
                switch (action) {
                    case fsReqType.lock:
                        if (state.lock) {
                            state.lock -= 1;
                        }
                        break;
                    case fsReqType.access:
                        state.access -= 1;
                        break;
                    case fsReqType.unlink:
                        state.unlink -= 1;
                        break;
                }
                chai.expect(ffName).to.be.a('string');
                log.debug({ffName, state}, 'release hook done');
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

            state.unlink += 1;
            await file.unlink();
        } catch (e) {
            log.error(e, 'ERROR during file write test');
            throw e;
        }

        return new Promise((res, rej) => {
            setTimeout(() => {
                try {
                    chai.expect(state).to.be.deep.equal({
                        lock: 0,
                        access: 0,
                        unlink: 0,
                    });
                    res();
                } catch (e) {
                    rej(e);
                }
            }, 100);
        });
    });
    it('store object should transactional lock access & unlink data', async () => {
        const fileName = 'tmp_01.tmp';
        const file = FSTextFactory(
            {fileName},
            {
                fsStorePrefix: prefix,
            },
        );

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
