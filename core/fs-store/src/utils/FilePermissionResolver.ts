/**
 * FilePermissionResolver - is the class ensuring order & possibility of some operations on dataId (fileName).
 * service should be started for each dataId separately
 *
 * allowed actions/operations are:
 * - lock - can be performed by multiple agents at the same time (POOL) - do not delete untill unlock
 * - access (write/append) - can be performed only by one agent at the time (QUEUE)
 * - unlink (delete) - can be performed by one at a time, but action order can be ruled by FS
 *
 * action flow - agents can request permissions for read/write and delete(unlink) access or
 *  lock so the dataId(fileName) could not get permission for deleted until all locks will be unlocked
 *
 */
import {PluggableModule} from '@testring-dev/pluggable-module';
import {MultiLock, Queue} from '@testring-dev/utils';

export const hooks = {
    ON_LOCK: 'onLockAcquire',
    ON_UNLOCK: 'onLockRelease',
    ON_ACCESS: 'onAccessAcquire',
    ON_ACCESS_RELEASE: 'onAccessRelease',
    ON_UNLINK: 'onUnlinkAcquire',
    ON_UNLINK_RELEASE: 'onUnlinkRelease', // do we need to have a hook for ending delete call
};

export enum actionState {
    'locked',
    'access',
    'free',
    'deleting',
    'deleted',
}

export type actionObject = {
    dataId: string;
    status?: actionState;
};

export type actionCB = (meta: actionObject, cleanCB?: () => void) => void;

export class FilePermissionResolver extends PluggableModule {
    private access: Queue<[string, string, actionCB]> = new Queue<
        [string, string, actionCB]
    >();
    private accessing = false;
    private multiLock: MultiLock; // lock pool
    private del: Queue<[string, string, actionCB]> = new Queue<
        [string, string, actionCB]
    >();

    private state: actionState;

    /**
     *
     * @param dataId - a string dataId (fileName)
     *
     */
    constructor(private dataId: string) {
        super(Object.values(hooks));
        this.multiLock = new MultiLock(); // no limit for locks
        this.state = actionState.free;
    }

    get status() {
        return this.state;
    }

    public getLockPoolSize() {
        return {queue: this.multiLock.getSize()};
    }

    public getAccessQueueLength() {
        return {active: this.accessing ? 1 : 0, queue: this.access.length};
    }

    public getUnlinkQueueLength() {
        return {queue: this.del.length};
    }

    public lock(workerId: string, requestId: string, cb: actionCB): boolean {
        if (this.isDeleted()) {
            return false;
        }
        // should always be true since Multilock is unlimited
        if (this.multiLock.acquire(workerId)) {
            this.state = actionState.locked;
            this.callHook(hooks.ON_LOCK, {workerId, requestId});
            cb({dataId: this.dataId, status: this.state}, () => {
                this.unlock(workerId, requestId);
            });
        }
        return true;
    }

    public unlock(workerId: string, requestId: string) {
        if (this.multiLock.release(workerId)) {
            this.callHook(hooks.ON_UNLOCK, {workerId, requestId});
        }
        return this.chkEmpty();
    }

    public cleanLock(workerId: string | void) {
        if (!workerId) {
            this.multiLock.clean();
            this.callHook(hooks.ON_UNLOCK, {});
        } else {
            this.multiLock.clean(workerId);
            this.callHook(hooks.ON_UNLOCK, {workerId});
        }

        return this.chkEmpty();
    }

    // normalize state of FilePermissions to in sync with lock/access/unlink logic during unlocking/releseAccess action
    private chkEmpty() {
        if (
            this.multiLock.getSize() === 0 && // no locks are present
            this.access.length === 0 // access queue is empty
        ) {
            if (!this.accessing) {
                // no one currently accessing data
                this.state = actionState.free;
                this.tryDelete();
                return true;
            }
            this.state = actionState.access;
        } else if (this.multiLock.getSize() !== 0) {
            this.state = actionState.locked;
        }
        return true;
    }

    // normalize state of FilePermissions to in sync with access/unlink logic during releseAccess action
    private tryAccess() {
        if (this.isDeleted()) {
            return false;
        }
        if (this.accessing === true) {
            return true;
        }
        const item = this.access.shift();
        if (item) {
            const [workerId, requestId, cb] = item;
            this.accessing = true;
            this.callHook(hooks.ON_ACCESS, {workerId, requestId});
            cb({dataId: this.dataId}, () => {
                this.accessing = false;
                this.tryAccess();
                this.callHook(hooks.ON_ACCESS_RELEASE, {workerId, requestId});
            });
        } else {
            this.chkEmpty();
        }
        return true;
    }

    public hookAccess(
        workerId: string,
        requestId: string,
        cb: actionCB,
    ): boolean {
        if (this.isDeleted()) {
            return false;
        }
        this.access.push([workerId, requestId, cb]);
        return this.tryAccess();
    }

    public unhookAccess(workerId: string, requestId: string): boolean {
        if (this.isDeleted()) {
            return false;
        }
        this.access.remove(
            ([wId, rId]) => wId !== workerId && rId !== requestId,
        );
        return this.tryAccess();
    }

    public cleanAccess(workerId: string | void) {
        if (!workerId) {
            this.access.clean();
            this.callHook(hooks.ON_ACCESS_RELEASE, {});
        } else {
            this.access.remove(([itemWorkerId]) => itemWorkerId === workerId);
            this.callHook(hooks.ON_ACCESS_RELEASE, {workerId});
        }
    }

    // normalize state of FilePermissions to in sync with lock/access/unlink logic during delete action
    private tryDelete(): boolean {
        if (!this.canBeDeleted()) {
            return false;
        }
        const delItem = this.del.shift();
        if (delItem) {
            if (!this.isDeleted()) {
                this.state = actionState.deleting;
            }
            const [workerId, requestId, cb] = delItem;
            this.callHook(hooks.ON_UNLINK, {workerId, requestId});
            cb({dataId: this.dataId, status: this.state}, () => {
                this.state = actionState.deleted;
                this.callHook(hooks.ON_UNLINK_RELEASE, {workerId, requestId});
                this.tryDelete();
            });
            return true;
        }
        return false;
    }

    private canBeDeleted() {
        return this.state >= actionState.free;
    }
    private isDeleted() {
        return this.state > actionState.free;
    }

    public hookUnlink(workerId: string, requestId: string, cb: actionCB) {
        this.del.push([workerId, requestId, cb]);
        this.tryDelete();
    }

    public unhookUnlink(workerId: string, requestId: string): boolean {
        this.del.remove(([wId, rId]) => wId !== workerId && rId !== requestId);
        return this.tryAccess();
    }

    public cleanUnlink(workerId: string | void) {
        if (!workerId) {
            this.del.clean();
            this.callHook(hooks.ON_UNLINK_RELEASE, {});
        } else {
            this.del.remove(([itemWorkerId]) => itemWorkerId === workerId);
            this.callHook(hooks.ON_UNLINK_RELEASE, {workerId});
        }
    }
}
