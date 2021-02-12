/// <reference types="mocha" />

import * as chai from 'chai';
// import * as sinon from 'sinon';

import { FSActionQueue, actionState } from '../src/fs-action-queue';

type chkObj= Record<string, number >;

function stateCheck(FAQ: FSActionQueue, access: chkObj, lock: chkObj, unlink: chkObj, msg: string) { 
    chai.expect(access).to.be.deep.equal(FAQ.getAccessQueueLength(), `access ${msg}`);
    chai.expect(lock).to.be.deep.equal(FAQ.getLockPoolSize(), `lock ${msg}`);
    chai.expect(unlink).to.be.deep.equal(FAQ.getUnlinkQueueLength(), `unlink ${msg}`);
        
}

describe('Action queue', () => {
    it('should init queue and process file through read-write-delete states', (done) => {
        
        const fileName = 'test';
        const FAQ = new FSActionQueue(fileName);

        stateCheck(FAQ, { active: 0, queue: 0 },{ queue: 0 },{ queue: 0 }, 'on init' );

        const pData = [
            { workerId : 'w1', requestId: 'r1' },
            { workerId : 'w2', requestId: 'r2' },
            { workerId : 'w3', requestId: 'r3' },
        ];
        FAQ.lock(pData[0].workerId, pData[0].requestId, ({ dataId, status }) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });
        FAQ.lock(pData[1].workerId, pData[1].requestId, ({ dataId, status }) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });
        FAQ.lock(pData[2].workerId, pData[2].requestId, ({ dataId, status }) => {
            chai.expect(status).to.be.equals(actionState.locked);
            chai.expect(dataId).to.be.equals(fileName);
        });
        
        stateCheck(FAQ, { active: 0, queue: 0 },{ queue: 3 },  { queue: 0 }, 'on after lock 3');
        
        FAQ.unlock(pData[0].workerId, pData[0].requestId);
        stateCheck(FAQ, { active: 0, queue: 0 }, { queue: 2 }, { queue: 0 }, 'on after release 1');

        
        FAQ.hookAccess(pData[0].workerId, pData[0].requestId, ({ dataId }, cleanCB) => {
            chai.expect(dataId).to.be.equals(fileName);
            stateCheck(FAQ, { active: 1, queue: 0 }, { queue: 2 },{ queue: 0 }, 'in accessHook');
            cleanCB && cleanCB();
        });

        stateCheck(FAQ, { active: 0, queue: 0 }, { queue: 2 },{ queue: 0 }, 'after Access hook');
        
        FAQ.hookAccess(pData[1].workerId, pData[1].requestId, ({ dataId }, cleanCB) => {
            chai.expect(dataId).to.be.equals(fileName);
            stateCheck(FAQ, { active: 1, queue: 0 }, { queue: 2 }, { queue: 0 }, 'in accessHook1');
            setTimeout(() => {
                cleanCB && cleanCB();
            }, 100);
        });
        FAQ.hookAccess(pData[2].workerId, pData[2].requestId, ({ dataId }, cleanCB) => {
            chai.expect(dataId).to.be.equals(fileName);
            stateCheck(FAQ, { active: 1, queue: 0 }, { queue: 2 }, { queue: 2 }, 'in AccessHook2');
            cleanCB && cleanCB();
        });

        stateCheck(FAQ, { active: 1, queue: 1 }, { queue: 2 },{ queue: 0 }, 'after Access hook 2');
        
        
        FAQ.hookUnlink(pData[0].workerId, pData[0].requestId, ({ dataId, status }, cleanCB) => {
            chai.expect(dataId).to.be.equals(fileName);
            chai.expect(status).to.be.equals(actionState.free, 'on first Unlink should get "empty"');
            stateCheck(FAQ,
                { active: 0, queue: 0 }, { queue: 0 }, { queue: 1 }, 'in unlinkHook');
            setTimeout(()=> cleanCB && cleanCB(), 100);            
        });

        FAQ.hookUnlink(pData[1].workerId, pData[1].requestId, ({ dataId, status }, cleanCB) => {
            chai.expect(dataId).to.be.equals(fileName);
            chai.expect(status).to.be.equals(actionState.deleted, 'on any after second "deleted"');
            stateCheck(FAQ,
                { active: 0, queue: 0 }, { queue: 0 }, { queue: 0 }, 'in unlinkHook2');
                cleanCB && cleanCB();
            });
            
        stateCheck(FAQ, { active: 1, queue: 1 }, { queue: 2 }, { queue: 2 }, 'after unlinkHook');
        
        setTimeout(()=>{
            stateCheck(FAQ, { active: 0, queue: 0 }, { queue: 2 }, { queue: 2 }, 'on after unlink hook TO');
            
            FAQ.unlock(pData[1].workerId, pData[1].requestId);
            stateCheck(FAQ,
                { active: 0, queue: 0 }, { queue: 1 }, { queue: 2 }, 'on after release lock 2');
                
            FAQ.unlock(pData[2].workerId, pData[2].requestId);
            stateCheck(FAQ,
                { active: 0, queue: 0 }, { queue: 0 }, { queue: 1 }, 'on after release lock 3');
                
            setTimeout(() => {    
                stateCheck(FAQ,
                    { active: 0, queue: 0 }, { queue: 0 }, { queue: 0 }, 'on after release read 3');
                done();
                
            }, 150);
        }, 150);
        
    });

});
