/// <reference types="mocha" />

import * as chai from 'chai';

import {
    FilePermissionResolver,
    actionState,
} from '../../src/utils/FilePermissionResolver';

type chkObj = Record<string, number>;

function stateCheck(
    FPR: FilePermissionResolver,
    access: chkObj,
    lock: chkObj,
    unlink: chkObj,
    msg: string,
) {
    chai.expect(access).to.be.deep.equal(
        FPR.getAccessQueueLength(),
        `access ${msg}`,
    );
    chai.expect(lock).to.be.deep.equal(FPR.getLockPoolSize(), `lock ${msg}`);
    chai.expect(unlink).to.be.deep.equal(
        FPR.getUnlinkQueueLength(),
        `unlink ${msg}`,
    );
}

describe('fs-permission', () => {
    it('should init queue and process file through read-write-delete states', (done) => {
        const fileName = 'test';
        const FPR = new FilePermissionResolver(fileName);

        stateCheck(
            FPR,
            {active: 0, queue: 0},
            {queue: 0},
            {queue: 0},
            'on init',
        );

        const pData = [
            {workerId: 'w1', requestId: 'r1'},
            {workerId: 'w2', requestId: 'r2'},
            {workerId: 'w3', requestId: 'r3'},
        ];
        if (!pData[0] || !pData[1] || !pData[2]) {
            throw new Error('pData[x] is undefined');
        }
        FPR.lock(pData[0].workerId, pData[0].requestId, ({dataId, status}) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });
        FPR.lock(pData[1].workerId, pData[1].requestId, ({dataId, status}) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });
        FPR.lock(pData[2].workerId, pData[2].requestId, ({dataId, status}) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });

        stateCheck(
            FPR,
            {active: 0, queue: 0},
            {queue: 3},
            {queue: 0},
            'on after lock 3',
        );

        FPR.unlock(pData[0].workerId, pData[0].requestId);
        stateCheck(
            FPR,
            {active: 0, queue: 0},
            {queue: 2},
            {queue: 0},
            'on after release 1',
        );

        FPR.hookAccess(
            pData[0].workerId,
            pData[0].requestId,
            ({dataId}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                stateCheck(
                    FPR,
                    {active: 1, queue: 0},
                    {queue: 2},
                    {queue: 0},
                    'in accessHook',
                );
                cleanCB && cleanCB();
            },
        );

        stateCheck(
            FPR,
            {active: 0, queue: 0},
            {queue: 2},
            {queue: 0},
            'after Access hook',
        );

        FPR.hookAccess(
            pData[1].workerId,
            pData[1].requestId,
            ({dataId}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                stateCheck(
                    FPR,
                    {active: 1, queue: 0},
                    {queue: 2},
                    {queue: 0},
                    'in accessHook1',
                );
                setTimeout(() => {
                    cleanCB && cleanCB();
                }, 100);
            },
        );
        FPR.hookAccess(
            pData[2].workerId,
            pData[2].requestId,
            ({dataId}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                stateCheck(
                    FPR,
                    {active: 1, queue: 0},
                    {queue: 2},
                    {queue: 2},
                    'in AccessHook2',
                );
                cleanCB && cleanCB();
            },
        );

        stateCheck(
            FPR,
            {active: 1, queue: 1},
            {queue: 2},
            {queue: 0},
            'after Access hook 2',
        );

        FPR.hookUnlink(
            pData[0].workerId,
            pData[0].requestId,
            ({dataId, status}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                chai.expect(status).to.be.equals(
                    actionState.deleting,
                    'on first Unlink should get transitian state deleting ',
                );
                stateCheck(
                    FPR,
                    {active: 0, queue: 0},
                    {queue: 0},
                    {queue: 1},
                    'in unlinkHook',
                );
                setTimeout(() => cleanCB && cleanCB(), 100);
            },
        );

        FPR.hookUnlink(
            pData[1].workerId,
            pData[1].requestId,
            ({dataId, status}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                chai.expect(status).to.be.equals(
                    actionState.deleted,
                    'on any after second "deleted"',
                );
                stateCheck(
                    FPR,
                    {active: 0, queue: 0},
                    {queue: 0},
                    {queue: 0},
                    'in unlinkHook2',
                );
                cleanCB && cleanCB();
            },
        );

        stateCheck(
            FPR,
            {active: 1, queue: 1},
            {queue: 2},
            {queue: 2},
            'after unlinkHook',
        );

        setTimeout(() => {
            stateCheck(
                FPR,
                {active: 0, queue: 0},
                {queue: 2},
                {queue: 2},
                'on after unlink hook TO',
            );

            if (!pData[0] || !pData[1] || !pData[2]) {
                throw new Error('pData[x] is undefined');
            }

            FPR.unlock(pData[1].workerId, pData[1].requestId);
            stateCheck(
                FPR,
                {active: 0, queue: 0},
                {queue: 1},
                {queue: 2},
                'on after release lock 2',
            );

            FPR.unlock(pData[2].workerId, pData[2].requestId);
            stateCheck(
                FPR,
                {active: 0, queue: 0},
                {queue: 0},
                {queue: 1},
                'on after release lock 3',
            );

            setTimeout(() => {
                stateCheck(
                    FPR,
                    {active: 0, queue: 0},
                    {queue: 0},
                    {queue: 0},
                    'on after release read 3',
                );
                done();
            }, 150);
        }, 150);
    });
});
