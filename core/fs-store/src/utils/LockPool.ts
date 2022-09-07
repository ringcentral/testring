/**
 * LockPool is an abstraction to manage pool of locks from different sources with max locks amount at once
 * LockPool maintain a count of total locks & map of src->lock_count (acquire & release the locks)
 * on acquire check if lock can be activated and gives permission if so otherwise it puts the request into requestQue
 * on release object extracts (decreases amount) permission from workerId amount
 *
 */

import {MultiLock, Queue} from '@testring-dev/utils';
import {ILockPool} from '@testring-dev/types';

type queueItem = {
    workerId: string;
    requestId?: string;
    notifier?: (b: boolean) => void;
};

export class LockPool implements ILockPool {
    private poolLock: MultiLock;
    private requestQue: Queue<queueItem>;
    private requests: Set<string>;

    constructor(maxLockCount = 10) {
        this.requests = new Set();
        this.requestQue = new Queue<queueItem>();
        this.poolLock = new MultiLock(maxLockCount);
    }

    public getState() {
        return {
            curLocks: this.poolLock.getSize(),
            maxLocks: this.poolLock.lockLimit,
            lockQueueLen: this.requestQue.length,
            locks: this.poolLock.getIds(),
        };
    }

    public acquire(workerId: string, requestId?: string) {
        if (requestId) {
            if (this.requests.has(requestId)) {
                return Promise.reject(`Repeating requestId  '${requestId}'`);
            }
            this.requests.add(requestId);
        }

        return this.acquireAction(workerId, requestId);
    }

    private acquireAction(workerId: string, requestId?: string) {
        if (this.poolLock.acquire(workerId)) {
            return Promise.resolve(true);
        }

        return new Promise<boolean>((res) => {
            this.requestQue.push({
                workerId,
                requestId,
                notifier: (allow: Boolean) => {
                    allow ? res(true) : res(false);
                },
            });
        });
    }

    public release(workerId: string, requestId: string) {
        // if releasing item is still in the queue
        const removed = this.requestQue.extract(function (item: queueItem) {
            const {workerId: wId, requestId: rId} = item;
            return wId === workerId && rId === requestId;
        });
        if (removed.length > 0) {
            const r = removed[0];
            r.notifier && r.notifier(false);
            return true;
        }

        // release from the pool
        const released = this.poolLock.release(workerId);

        // if released, try acquire new lock from queue
        if (released) {
            const newItem = this.requestQue.shift();
            if (newItem) {
                const {
                    workerId: newWorkerId,
                    requestId: newRequestId,
                    notifier: newNotifier,
                } = newItem;
                this.acquireAction(newWorkerId, newRequestId).then(() => {
                    newNotifier && newNotifier(true);
                });
            }
            this.requests.delete(requestId);
            return true;
        }
        return false;
    }

    public clean(workerId: string | void) {
        if (!workerId) {
            this.poolLock.clean();
            this.requestQue
                .extract(() => true)
                .forEach((item) => item.notifier && item.notifier(false));
        } else {
            this.poolLock.clean(workerId);
            this.requestQue
                .extract(([itemWorkerId]) => itemWorkerId === workerId)
                .forEach((item) => item.notifier && item.notifier(false));
        }
    }
}
