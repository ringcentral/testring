/**
 * LockPool is an abstraction to manage pool of locks from different sources with max locks amount at once
 * LockPool maintain a count of total locks & map of src->lock_count (acquire & release the locks)
 * on acquire check if lock can be activated and gives permission if so otherwise it puts the request into requestQue
 * on release object extracts (decreases amount) permission from workerId amount
 *
 */

import {PluggableModule} from '@testring/pluggable-module';
import {MultiLock, Queue} from '@testring/utils';

const hooks = {
    ON_ACQUIRE: 'onAcquire',
    ON_RELEASE: 'onRelease',
};

export {hooks};

export class LockPool extends PluggableModule {
    private poolLock: MultiLock;
    private requestQue: Queue<[string, string]> = new Queue<[string, string]>();

    constructor(maxLockCount = 10) {
        super(Object.values(hooks));
        this.poolLock = new MultiLock(maxLockCount);
    }

    public getState = (getIds = false) => ({
        queVolume: this.poolLock.lockLimit,
        curLocks: this.poolLock.getSize(),
        maxLocks: this.poolLock.lockLimit,
        locks: getIds ? this.poolLock.getIds() : undefined,
    });

    public acquire(workerId: string, requestId: string) {
        if (this.poolLock.acquire(workerId)) {
            this.callHook(hooks.ON_ACQUIRE, {workerId, requestId});
        } else {
            this.requestQue.push([workerId, requestId]);
        }
    }

    public release(workerId: string, requestId: string) {
        const removed = this.requestQue.remove(
            ([wId, rId]) => wId === workerId && rId === requestId,
        );
        if (removed > 0) {
            return;
        }
        this.poolLock.release(workerId);
        this.callHook(hooks.ON_RELEASE, {workerId, requestId});
        const newItem = this.requestQue.shift();
        if (newItem) {
            this.acquire(newItem[0], newItem[1]);
        }
    }

    public clean(workerId: string | void) {
        if (!workerId) {
            this.poolLock.clean();
            this.requestQue.clean();
        } else {
            this.poolLock.clean(workerId);
            this.requestQue.remove(
                ([itemWorkerId]) => itemWorkerId === workerId,
            );
        }
    }
}
