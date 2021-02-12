/**
 * FSActionQueue - is the class ensuring order & possibility of some operations on data.
 * allowed actions/operations are:
 * - read - can be performed by multiple agents at the same time (pool)
 * - write (append) - can be performed only by one agent at the time QUEUE is
 * - unlink (delete) - can be performed by one at a time, but action order can be ruled by FS
 * 
 * action flow - agents can request permissions for read write and delete(unlink) access 
 * 
 */
import { PluggableModule } from '@testring/pluggable-module';
import { MultiLock, Queue } from '@testring/utils';

export const hooks = {
    ON_LOCK: 'onLockAcquire',
    ON_UNLOCK: 'onLockRelease',
    ON_ACCESS: 'onAccessAcquire',
    ON_ACCESS_RELEASE: 'onAccessRelease',
    ON_UNLINK: 'onUnlinkAcquire',
    ON_UNLINK_RELEASE: 'onUnlinkRelease', // do we need to have a hook for ending delete call
};

export enum actionState {
    'init' = 0,
    'locked',
    'access',
    'free',
    'deleted',
}

export type actionObject = {
    dataId: string;
    status?: actionState;
}

export type actionCB = (meta: actionObject, cleanCB?: () => void) => void

export class FSActionQueue extends PluggableModule {

    private access: Queue<[string, string, actionCB]> = new Queue<[string, string, actionCB]>();
    private accessing: boolean = false;
    private lockPool: MultiLock; // lock pool
    private del: Queue<[string, string, actionCB]> = new Queue<[string, string, actionCB]>();

    private state: actionState;

    /**
     * 
     * @param dataId - a string dataId (fileName)
     * 
     */
    constructor(private dataId: string) {
        super(Object.values(hooks));
        this.lockPool = new MultiLock(); // no limit for lock
        this.state = actionState.init;
    }

    get status() {
        return this.state;
    }

    public getLockPoolSize() {
        return { queue: this.lockPool.getSize() };
    }

    public getAccessQueueLength() {
        return { active: this.accessing ? 1 : 0, queue: this.access.length };
    }

    public getUnlinkQueueLength() {
        return { queue: this.del.length };
    }

    public lock(workerId: string, requestId: string, cb: actionCB): boolean {
        if (this.state === actionState.deleted) {
            return false;
        }
        if (this.lockPool.acquire(workerId)) { // should always be true since Multilock is unlimited 
            this.state = actionState.locked;
            this.callHook(hooks.ON_LOCK, { workerId, requestId });
            cb({ dataId: this.dataId, status: this.state }, () => {
                this.unlock(workerId, requestId);
            });
        }
        return true;
    }

    public unlock(workerId: string, requestId: string) {
        // console.log('FAQ unlock', workerId, requestId, Date.now());
        if (this.lockPool.release(workerId)) {
            this.callHook(hooks.ON_UNLOCK, { workerId, requestId });
        }
        return this.chkEmpty();
    }

    public cleanLock(workerId: string | void) {
        if (!workerId) {
            this.lockPool.clean();
            this.callHook(hooks.ON_UNLOCK, {});
        } else {
            this.lockPool.clean(workerId);
            this.callHook(hooks.ON_UNLOCK, { workerId });
        }

        return this.chkEmpty();
    }

    private chkEmpty() {

        // console.log('FAQ chkEmpty', this.lockPool.getSize(), this.access.length, this.accessing);
        if (
            this.lockPool.getSize() === 0 // no locks are present
            && this.access.length === 0 // access queue is empty
        ) {
            if (!this.accessing) {  // no one currently accessing data
                this.state = actionState.free;
                return this.tryDelete();
            }
            this.state = actionState.access;
        } else if (this.lockPool.getSize() !== 0) {
            this.state = actionState.locked;
        }
        return true;
    }

    private tryAccess() {
        if (this.state === actionState.deleted) {
            return false;
        }
        if (this.accessing === true) {
            return true;
        }
        const item = this.access.shift();
        if (item) {
            const [workerId, requestId, cb] = item;
            this.accessing = true;
            this.callHook(hooks.ON_ACCESS, { workerId, requestId });
            cb({ dataId: this.dataId }, () => {
                this.accessing = false;
                this.tryAccess();
                this.callHook(hooks.ON_ACCESS_RELEASE, { workerId, requestId });
            });
        } else {
            this.chkEmpty();
        }
        return true;
    }

    public hookAccess(workerId: string, requestId: string, cb: actionCB): boolean {
        if (this.state === actionState.deleted) {
            return false;
        }
        this.access.push([workerId, requestId, cb]);
        return this.tryAccess();
    }

    public cleanAccess(workerId: string | void) {
        if (!workerId) {
            this.access.clean();
            this.callHook(hooks.ON_ACCESS_RELEASE, {});
        } else {
            this.access.remove(([itemWorkerId]) => itemWorkerId === workerId);
            this.callHook(hooks.ON_ACCESS_RELEASE, { workerId });
        }
    }

    private tryDelete(): boolean {
        // console.log('FAQ tryDelete', this.state, '<', actionState.free, this.del.length);

        if (this.state < actionState.free) {
            return false;
        }
        const delItem = this.del.shift();
        if (delItem) {
            const [workerId, requestId, cb] = delItem;
            this.callHook(hooks.ON_UNLINK, { workerId, requestId });
            cb({ dataId: this.dataId, status: this.state }, () => {
                this.state = actionState.deleted;
                this.callHook(hooks.ON_UNLINK_RELEASE, { workerId, requestId });
                this.tryDelete();
            });
        }
        return true;
    }

    public hookUnlink(workerId: string, requestId: string, cb: actionCB) {
        this.del.push([workerId, requestId, cb]);
        this.tryDelete();
    }

    public cleanUnlink(workerId: string | void) {
        if (!workerId) {
            this.del.clean();
            this.callHook(hooks.ON_UNLINK_RELEASE, {});
        } else {
            this.del.remove(([itemWorkerId]) => itemWorkerId === workerId);
            this.callHook(hooks.ON_UNLINK_RELEASE, { workerId });
        }
    }
}
