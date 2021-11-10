/// <reference types="mocha" />

import * as chai from 'chai';

import {MultiLock} from '../src/multi-lock';

const LockMaxAmount = 3;

describe('multi-lock', () => {
    it('should successfully lock', () => {
        const lock = new MultiLock(LockMaxAmount);
        const id = 'test';
        const acquire = lock.acquire(id);
        // eslint-disable-next-line no-unused-expressions
        chai.expect(acquire).to.be.true;

        chai.expect(lock.getSize(id)).to.be.equal(1);
        chai.expect(lock.getSize()).to.be.equal(1);
    });

    it('should Unsuccessfully lock & clean', () => {
        const lock = new MultiLock(LockMaxAmount);
        const id = 'test';
        const id2 = 'test2';
        lock.acquire(id); // true
        chai.expect(lock.getSize()).to.be.equal(1);
        lock.acquire(id); // true
        chai.expect(lock.getSize()).to.be.equal(2);
        lock.acquire(id2); // true
        chai.expect(lock.getSize()).to.be.equal(3);

        const acquire = lock.acquire(id); // false
        // eslint-disable-next-line no-unused-expressions
        chai.expect(acquire).to.be.false;

        chai.expect(lock.getSize(id)).to.be.equal(2);
        chai.expect(lock.getSize(id2)).to.be.equal(1);

        lock.clean();
        chai.expect(lock.getSize(id)).to.be.equal(0);
        chai.expect(lock.getSize(id2)).to.be.equal(0);
        chai.expect(lock.getSize()).to.be.equal(0);
    });

    it('should successfully lock & release', () => {
        const lock = new MultiLock(LockMaxAmount);
        const id = 'test';
        const id2 = 'test2';
        lock.acquire(id);
        lock.acquire(id);
        lock.acquire(id2);
        const acquire = lock.acquire(id);
        // eslint-disable-next-line no-unused-expressions
        chai.expect(acquire).to.be.false;

        lock.release(id);
        chai.expect(lock.getSize()).to.be.equal(2);
        const acquire2 = lock.acquire(id2);
        // eslint-disable-next-line no-unused-expressions
        chai.expect(acquire2).to.be.true;

        chai.expect(lock.getSize(id)).to.be.equal(1);
        chai.expect(lock.getSize(id2)).to.be.equal(2);
        chai.expect(lock.getSize()).to.be.equal(3);

        lock.clean(id2);
        chai.expect(lock.getSize(id)).to.be.equal(1);
        chai.expect(lock.getSize(id2)).to.be.equal(0);
        chai.expect(lock.getSize()).to.be.equal(1);

        lock.clean(id);
        chai.expect(lock.getSize(id)).to.be.equal(0);
        chai.expect(lock.getSize(id2)).to.be.equal(0);
        chai.expect(lock.getSize()).to.be.equal(0);
    });
});
