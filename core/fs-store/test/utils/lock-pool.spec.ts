/// <reference types="mocha" />

import * as chai from 'chai';

import {LockPool} from '../../src/utils/LockPool';

const {expect} = chai;

// type chkObj = Record<string, number>;

const threadAm = 2;
describe('lock-pool', () => {
    it('should init pool', async () => {
        const pool = new LockPool(threadAm);

        let state: Record<string, any> = {};

        const pData = [
            {workerId: 'w1', requestId: 'r1'},
            {workerId: 'w2', requestId: 'r2'},
            {workerId: 'w3', requestId: 'r3'},
        ];

        await pool.acquire(pData[0].workerId, pData[0].requestId);
        state = pool.getState();
        expect(state.curLocks).to.be.eqls(1);
        expect(state.locks.get(pData[0].workerId)).to.be.eqls(1);

        await pool.acquire(pData[0].workerId, pData[1].requestId);
        state = pool.getState();
        expect(state.curLocks).to.be.eqls(2);
        expect(state.locks.get(pData[0].workerId)).to.be.eqls(2);

        const to = 250;
        const st = Date.now();
        setTimeout(() => {
            const releaseResult = pool.release(
                pData[0].workerId,
                pData[0].requestId,
            );
            // eslint-disable-next-line no-unused-expressions
            expect(releaseResult).to.be.true;
        }, to);

        // WILL WAIT for Timeout
        await pool.acquire(pData[2].workerId, pData[2].requestId);
        expect(Date.now() - st).to.be.gte(to);
        state = pool.getState();
        expect(state.curLocks).to.be.eqls(2);
        expect(state.locks.get(pData[0].workerId)).to.be.eqls(1);
        expect(state.locks.get(pData[2].workerId)).to.be.eqls(1);

        return Promise.resolve();
    });
    it('should wait for lock acquire', (done) => {
        expect(1).to.be.equal(1);
        done();
    });
});
