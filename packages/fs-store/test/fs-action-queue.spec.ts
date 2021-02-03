/// <reference types="mocha" />

import * as chai from 'chai';
import { nextTick } from 'process';
// import * as sinon from 'sinon';

import { FSActionQueue } from '../src/fs-action-queue';

type chkObj= Record<string, number >;

function stateCheck(FAQ: FSActionQueue, read: chkObj, write: chkObj, unlink: chkObj, msg: string) { 
    chai.expect(read).to.be.deep.equal(FAQ.getReadPoolSize(), `read ${msg}`);
    chai.expect(write).to.be.deep.equal(FAQ.getWriteQueueLength(), `write ${msg}`);
    chai.expect(unlink).to.be.deep.equal(FAQ.getUnlinkQueueLength(), `unlink ${msg}`);
        
}

describe('Action queue', () => {
    it('should init queue and process file through read-write-delete states', (done) => {
        
        const fileName = 'test';
        const FAQ = new FSActionQueue(fileName, 2);

        stateCheck(FAQ, { active: 0, inQueue: 0 },{ active: 0, inQueue: 0 },{ inQueue: 0 }, 'on init' );

        const pData = [
            { workerId : 'w1', requestId: 'r1' },
            { workerId : 'w2', requestId: 'r2' },
            { workerId : 'w3', requestId: 'r3' },
        ];
        FAQ.acquireRead(pData[0].workerId, pData[0].requestId, (fName) => {
            chai.expect(fName).to.be.equals(fileName);
        });
        FAQ.acquireRead(pData[1].workerId, pData[1].requestId, (fName) => {
            chai.expect(fName).to.be.equals(fileName);
        });
        FAQ.acquireRead(pData[2].workerId, pData[2].requestId, (fName) => {
            chai.expect(fName).to.be.equals(fileName);
        });
        
        stateCheck(FAQ, { active: 2, inQueue: 1 }, { active: 0, inQueue: 0 }, { inQueue: 0 }, 'on after read 3');
        
        FAQ.releaseRead(pData[0].workerId, pData[0].requestId);
        stateCheck(FAQ, { active: 1, inQueue: 1 }, { active: 0, inQueue: 0 }, { inQueue: 0 }, 'on after release 1');
        
        FAQ.hookWrite(pData[0].workerId, pData[0].requestId, (fName, cleanCB) => {
            chai.expect(fName).to.be.equals(fileName);
            stateCheck(FAQ, { active: 1, inQueue: 0 }, { active: 1, inQueue: 0 }, { inQueue: 2 }, 'in writeHook');
            cleanCB && cleanCB();
        });
        stateCheck(FAQ, { active: 1, inQueue: 1 }, { active: 0, inQueue: 1 }, { inQueue: 0 }, 'on Write hook');
        
        nextTick(() => {
            stateCheck(FAQ,
                { active: 2, inQueue: 0 }, { active: 0, inQueue: 1 }, { inQueue: 0 }, 'on Write hook & wait');
        
            FAQ.hookUnlink(pData[0].workerId, pData[0].requestId, (fName) => {
                chai.expect(fName).to.be.equals(fileName);
                chai.expect(FAQ.status).to.be.equals(2); // on first Unlink
                stateCheck(FAQ,
                    { active: 0, inQueue: 0 }, { active: 0, inQueue: 0 }, { inQueue: 1 }, 'in unlinkHook');
                
            });
            FAQ.hookUnlink(pData[1].workerId, pData[1].requestId, (fName) => {
                chai.expect(fName).to.be.equals(fileName);
                chai.expect(FAQ.status).to.be.equals(3); // on first Unlink we should
                stateCheck(FAQ,
                    { active: 0, inQueue: 0 }, { active: 0, inQueue: 0 }, { inQueue: 0 }, 'in unlinkHook');
                done();
            });
            stateCheck(FAQ,
                { active: 2, inQueue: 0 }, { active: 0, inQueue: 1 }, { inQueue: 2 }, 'on after unlinkHook');
        
            FAQ.releaseRead(pData[1].workerId, pData[1].requestId);
            stateCheck(FAQ,
                { active: 1, inQueue: 0 }, { active: 0, inQueue: 1 }, { inQueue: 2 }, 'on after release read 2');
        
            FAQ.releaseRead(pData[2].workerId, pData[2].requestId);
            stateCheck(FAQ,
                { active: 0, inQueue: 0 }, { active: 0, inQueue: 1 }, { inQueue: 2 }, 'on after release read 3');

            nextTick(() => { 
                const acqRes = FAQ.acquireRead(pData[2].workerId, pData[2].requestId, (fName) => {
                    chai.expect(fName).to.be.equals(fileName);
                });

                chai.expect(acqRes).to.be.equals(true);

                stateCheck(FAQ,
                    { active: 1, inQueue: 0 }, { active: 0, inQueue: 1 }, { inQueue: 2 }, 'on after read 1');
                
                nextTick(() => { 
                    // by this time write cb should be done
                    stateCheck(FAQ,
                        { active: 1, inQueue: 0 }, { active: 0, inQueue: 0 }, { inQueue: 2 }, 'on after read 1 & wait');
                    
                    FAQ.releaseRead(pData[2].workerId, pData[2].requestId);
                    chai.expect(FAQ.status).to.be.equal(0, 'state should be READ (0)');
                    stateCheck(FAQ,
                        { active: 0, inQueue: 0 }, { active: 0, inQueue: 0 }, { inQueue: 2 }, 'on after release 1');
                    
                    nextTick(() => {
                        stateCheck(FAQ,
                            { active: 0, inQueue: 0 },
                            { active: 0, inQueue: 0 },
                            { inQueue: 2 }, 'on after release & wait');
                    });
                });
            });
        });
        
    });

});
