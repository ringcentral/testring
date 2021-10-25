/// <reference types="mocha" />

import * as chai from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import {
    FSStoreServer,
    fsStoreServerHooks,
    FS_CONSTANTS,
} from '@testring/fs-store';
import {transport} from '@testring/transport';
import {
    IFSStoreReq,
    IFSStoreResp,
    fsReqType,
    FSFileUniqPolicy,
} from '@testring/types';

import {cbGen} from '../src/onFileName';

const msgNamePrefix = 'fs-plugin_test';

const reqName = msgNamePrefix + FS_CONSTANTS.FS_REQ_NAME_POSTFIX;
const respName = msgNamePrefix + FS_CONSTANTS.FS_RESP_NAME_POSTFIX;
const releaseReqName = msgNamePrefix + FS_CONSTANTS.FS_RELEASE_NAME_POSTFIX;
// const cleanReqName = msgNamePrefix + FS_CONSTANTS.FS_CLEAN_REQ_NAME_POSTFIX;

const testData: Record<string, any> = {
    'tmp.tmp': {workerId: 'abc', type: 'test', fullPath: './test/abc/tmp.tmp'},
    // 'tmp_0.tmp': {type: 'tmp', fullPath: './tmp/tmp_0.tmp'},
    // 'tmp_1.tmp': {type: 'tt', subtype: 'aa', fullPath: './tt/aa/tmp_1.tmp'},
};

describe('fs-store-plugin', () => {
    it('should init fss and test the transport lock', (done) => {
        const FSS = new FSStoreServer(10, msgNamePrefix);

        const fsPlugin = cbGen({test: './test', tmp: './tmp', tt: './tt'});

        const hook = FSS.getHook(fsStoreServerHooks.ON_FILENAME);

        chai.expect(hook).not.to.be.an(
            'undefined',
            'Hook ON_FILENAME in undefined',
        );

        hook && hook.writeHook('fsDefault', fsPlugin);

        const fNames = Object.keys(testData);
        let unlinkCount = fNames.length;

        const lockRequestID = 'lock_test';
        const accessRequestID = 'acc_test';
        const unlinkRequestID = 'unlink_test';

        transport.on<IFSStoreResp>(
            respName,
            ({requestId, fullPath, status, action}) => {
                chai.expect(requestId).to.be.oneOf([
                    lockRequestID,
                    accessRequestID,
                    unlinkRequestID,
                ]);
                const fileName = fullPath.split(path.sep).pop() || '';

                if (action === fsReqType.access) {
                    chai.expect(fileName).to.be.oneOf(fNames);
                    const metaData = testData[fileName];
                    transport.broadcastUniversally<IFSStoreReq>(
                        releaseReqName,
                        {
                            requestId: accessRequestID,
                            action: fsReqType.access,
                            meta: {
                                fileName,
                                type: metaData.type,
                                subtype: metaData.subtype,
                                uniqPolicy: metaData.workerId
                                    ? FSFileUniqPolicy.worker
                                    : FSFileUniqPolicy.global,
                                workerId: metaData.workerId,
                            },
                        },
                    );
                    chai.expect(fullPath).to.be.equals(metaData.fullPath);
                } else if (action === fsReqType.unlink) {
                    fs.promises
                        .unlink(fullPath)
                        .catch((e) => {
                            if (e.code !== 'ENOENT') {
                                done(e);
                            }
                        })
                        .finally(() => {
                            unlinkCount -= 1;
                            if (!unlinkCount) {
                                done();
                            }
                        });
                }
                chai.expect(status).to.be.a('string');
            },
        );

        fNames.forEach((fileName) => {
            const metaData = testData[fileName];
            transport.broadcastUniversally<IFSStoreReq>(reqName, {
                requestId: lockRequestID,
                action: fsReqType.lock,
                meta: {
                    fileName,
                    type: metaData.type,
                    subtype: metaData.subtype,
                    uniqPolicy: metaData.workerId
                        ? FSFileUniqPolicy.worker
                        : FSFileUniqPolicy.global,
                    workerId: metaData.workerId,
                },
            });
        });

        // unlock files
        fNames.forEach((fileName) => {
            const metaData = testData[fileName];
            transport.broadcastUniversally<IFSStoreReq>(releaseReqName, {
                requestId: lockRequestID,
                action: fsReqType.lock,
                meta: {
                    fileName,
                    type: metaData.type,
                    subtype: metaData.subtype,
                    uniqPolicy: metaData.workerId
                        ? FSFileUniqPolicy.worker
                        : FSFileUniqPolicy.global,
                    workerId: metaData.workerId,
                },
            });
        });

        // remove files;
        fNames.forEach((fileName) => {
            const metaData = testData[fileName];
            transport.broadcastUniversally<IFSStoreReq>(reqName, {
                requestId: unlinkRequestID,
                action: fsReqType.unlink,
                meta: {
                    fileName,
                    type: metaData.type,
                    subtype: metaData.subtype,
                    uniqPolicy: metaData.workerId
                        ? FSFileUniqPolicy.worker
                        : FSFileUniqPolicy.global,
                    workerId: metaData.workerId,
                },
            });
        });
    });
});
