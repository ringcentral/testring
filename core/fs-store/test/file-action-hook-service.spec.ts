/// <reference types="mocha" />

import * as chai from 'chai';

import {
    FileActionHookService,
    actionState,
} from '../src/server_utils/FileActionHookService';

type chkObj = Record<string, number>;

function stateCheck(
    FAHS: FileActionHookService,
    access: chkObj,
    lock: chkObj,
    unlink: chkObj,
    msg: string,
) {
    chai.expect(access).to.be.deep.equal(
        FAHS.getAccessQueueLength(),
        `access ${msg}`,
    );
    chai.expect(lock).to.be.deep.equal(FAHS.getLockPoolSize(), `lock ${msg}`);
    chai.expect(unlink).to.be.deep.equal(
        FAHS.getUnlinkQueueLength(),
        `unlink ${msg}`,
    );
}

describe('fs-action-queue', () => {
    it('should init queue and process file through read-write-delete states', (done) => {
        const fileName = 'test';
        const FAHS = new FileActionHookService(fileName);

        stateCheck(
            FAHS,
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
        FAHS.lock(pData[0].workerId, pData[0].requestId, ({dataId, status}) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });
        FAHS.lock(pData[1].workerId, pData[1].requestId, ({dataId, status}) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });
        FAHS.lock(pData[2].workerId, pData[2].requestId, ({dataId, status}) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });

        stateCheck(
            FAHS,
            {active: 0, queue: 0},
            {queue: 3},
            {queue: 0},
            'on after lock 3',
        );

        FAHS.unlock(pData[0].workerId, pData[0].requestId);
        stateCheck(
            FAHS,
            {active: 0, queue: 0},
            {queue: 2},
            {queue: 0},
            'on after release 1',
        );

        FAHS.hookAccess(
            pData[0].workerId,
            pData[0].requestId,
            ({dataId}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                stateCheck(
                    FAHS,
                    {active: 1, queue: 0},
                    {queue: 2},
                    {queue: 0},
                    'in accessHook',
                );
                cleanCB && cleanCB();
            },
        );

        stateCheck(
            FAHS,
            {active: 0, queue: 0},
            {queue: 2},
            {queue: 0},
            'after Access hook',
        );

        FAHS.hookAccess(
            pData[1].workerId,
            pData[1].requestId,
            ({dataId}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                stateCheck(
                    FAHS,
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
        FAHS.hookAccess(
            pData[2].workerId,
            pData[2].requestId,
            ({dataId}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                stateCheck(
                    FAHS,
                    {active: 1, queue: 0},
                    {queue: 2},
                    {queue: 2},
                    'in AccessHook2',
                );
                cleanCB && cleanCB();
            },
        );

        stateCheck(
            FAHS,
            {active: 1, queue: 1},
            {queue: 2},
            {queue: 0},
            'after Access hook 2',
        );

        FAHS.hookUnlink(
            pData[0].workerId,
            pData[0].requestId,
            ({dataId, status}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                chai.expect(status).to.be.equals(
                    actionState.free,
                    'on first Unlink should get "empty"',
                );
                stateCheck(
                    FAHS,
                    {active: 0, queue: 0},
                    {queue: 0},
                    {queue: 1},
                    'in unlinkHook',
                );
                setTimeout(() => cleanCB && cleanCB(), 100);
            },
        );

        FAHS.hookUnlink(
            pData[1].workerId,
            pData[1].requestId,
            ({dataId, status}, cleanCB) => {
                chai.expect(dataId).to.be.equals(fileName);
                chai.expect(status).to.be.equals(
                    actionState.deleted,
                    'on any after second "deleted"',
                );
                stateCheck(
                    FAHS,
                    {active: 0, queue: 0},
                    {queue: 0},
                    {queue: 0},
                    'in unlinkHook2',
                );
                cleanCB && cleanCB();
            },
        );

        stateCheck(
            FAHS,
            {active: 1, queue: 1},
            {queue: 2},
            {queue: 2},
            'after unlinkHook',
        );

        setTimeout(() => {
            stateCheck(
                FAHS,
                {active: 0, queue: 0},
                {queue: 2},
                {queue: 2},
                'on after unlink hook TO',
            );

            FAHS.unlock(pData[1].workerId, pData[1].requestId);
            stateCheck(
                FAHS,
                {active: 0, queue: 0},
                {queue: 1},
                {queue: 2},
                'on after release lock 2',
            );

            FAHS.unlock(pData[2].workerId, pData[2].requestId);
            stateCheck(
                FAHS,
                {active: 0, queue: 0},
                {queue: 0},
                {queue: 1},
                'on after release lock 3',
            );

            setTimeout(() => {
                stateCheck(
                    FAHS,
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
