/// <reference types="mocha" />

import * as chai from 'chai';
import * as os from 'os';
import * as path from 'path';

import {
    FSStoreServer,
    serverState,
    fsStoreServerHooks,
} from '../src/fs-store-server';
import {FS_CONSTANTS} from '../src/utils';

import {transport} from '@testring-dev/transport';

import {IFSStoreReq, IFSStoreResp, fsReqType} from '@testring-dev/types';

const msgNamePrefix = 'fs-st_test';

const reqName = msgNamePrefix + FS_CONSTANTS.FS_REQ_NAME_POSTFIX;
const respName = msgNamePrefix + FS_CONSTANTS.FS_RESP_NAME_POSTFIX;
const releaseReqName = msgNamePrefix + FS_CONSTANTS.FS_RELEASE_NAME_POSTFIX;
const cleanReqName = msgNamePrefix + FS_CONSTANTS.FS_CLEAN_REQ_NAME_POSTFIX;

describe('fs-store-server', () => {
    it('should init fss and test the transport lock', (done) => {
        const FSS = new FSStoreServer(10, msgNamePrefix);

        chai.expect(FSS.getState()).to.be.equal(serverState.initialized);

        const lockRequestID = 'lock_test';
        const accessRequestID = 'acc_test';
        const unlinkRequestID = 'unlink_test';

        const baseFileName = 'tmp.tmp';

        const state = {lock: 0, access: 0, unlink: 0};

        transport.on<IFSStoreResp>(
            respName,
            ({requestId, fullPath, status, action}) => {
                chai.expect(requestId).to.be.oneOf([
                    lockRequestID,
                    accessRequestID,
                    unlinkRequestID,
                ]);
                switch (action) {
                    case fsReqType.access:
                        state.access -= 1;
                        transport.broadcastUniversally<IFSStoreReq>(
                            releaseReqName,
                            {
                                requestId: accessRequestID,
                                action: fsReqType.access,
                                meta: {
                                    fileName: baseFileName,
                                },
                            },
                        );
                        break;
                    case fsReqType.unlink:
                        state.unlink -= 1;
                        break;
                }
                chai.expect(status).to.be.a('string');
                chai.expect(fullPath).to.be.a('string');
                chai.expect(fullPath).to.be.equals(
                    path.join(os.tmpdir(), baseFileName),
                );
            },
        );

        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        chai.expect(onRelease).not.to.be.an(
            'undefined',
            'Hook ON_RELEASE in undefined',
        );

        onRelease &&
            onRelease.readHook(
                'testRelease',
                ({requestId, fileName, action}) => {
                    chai.expect(requestId).to.be.oneOf([
                        lockRequestID,
                        accessRequestID,
                        unlinkRequestID,
                    ]);
                    switch (action) {
                        case fsReqType.lock:
                            state.lock -= 1;
                            break;
                    }
                    chai.expect(fileName).to.be.a('string');
                },
            );

        transport.broadcastUniversally<IFSStoreReq>(reqName, {
            requestId: lockRequestID,
            action: fsReqType.lock,
            meta: {
                fileName: baseFileName,
            },
        });
        state.lock += 1;

        transport.broadcastUniversally<IFSStoreReq>(reqName, {
            requestId: accessRequestID,
            action: fsReqType.access,
            meta: {
                fileName: baseFileName,
            },
        });
        state.access += 1;

        transport.broadcastUniversally<IFSStoreReq>(reqName, {
            requestId: unlinkRequestID,
            action: fsReqType.unlink,
            meta: {
                fileName: baseFileName,
            },
        });
        state.unlink += 1;

        setTimeout(() => {
            chai.expect(state).to.be.deep.equal({
                lock: 1,
                access: 0,
                unlink: 1,
            });
            transport.broadcastUniversally<IFSStoreReq>(releaseReqName, {
                requestId: lockRequestID,
                action: fsReqType.lock,
                meta: {
                    fileName: baseFileName,
                },
            });

            setTimeout(() => {
                chai.expect(state).to.be.deep.equal({
                    lock: 0,
                    access: 0,
                    unlink: 0,
                });

                transport.broadcastUniversally<{}>(cleanReqName, {});

                done();
            }, 100);
        }, 100);
    });
});
