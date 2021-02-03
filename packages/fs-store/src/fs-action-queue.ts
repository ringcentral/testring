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
import { nextTick } from 'process';

export const hooks = {
    ON_READ_ACQUIRE : 'onReadAcquire',
    ON_READ_RELEASE: 'onReadRelease',
    ON_WRITE_ACQUIRE : 'onWriteAcquire',
    ON_WRITE_RELEASE: 'onWriteRelease',
    ON_UNLINK_ACQUIRE : 'onUnlinkAcquire',
    // ON_UNLINK_RELEASE : 'onUnlinkRelease', // do we need to have a hook for ending delete call
};

export enum actionState { 
    'read'=0,
    'write',
    'readWriteEmpty',
    'deleted',
}

export type actionCB = (dataId: string, cleanCB?: () => void) => void
    
export class FSActionQueue extends PluggableModule {

    private read: MultiLock; // read pool
    private readQue: Queue<[string, string, actionCB]> = new Queue<[string, string, actionCB]>();
    private write: Queue<[string, string, actionCB]> = new Queue<[string, string, actionCB]>();
    private writing = false;
    private del: Queue<[string, string, actionCB]> = new Queue<[string, string, actionCB]>();

    private state: actionState;

    /**
     * 
     * @param dataId - a string dataId (fileName)
     * @param [readLockLimit] - a number for limiting readers amount at once, 0 - for unlimited
     * 
     */
    constructor(private dataId: string, readLockLimit = 0) {
        super(Object.values(hooks));
        this.read = new MultiLock(readLockLimit); // no limit for read
        this.state = actionState.read;
    }

    get status() {
        return this.state; 
    }

    public getReadPoolSize() { 
        return { active: this.read.getSize(), inQueue: this.readQue.length };
    }

    public getWriteQueueLength() { 
        return { active: this.writing?1:0 , inQueue:this.write.length };
    }
    public getUnlinkQueueLength() { 
        return { inQueue:this.del.length };
    }

    public acquireRead(workerId: string, requestId: string, cb: actionCB): boolean {
        if (this.state === actionState.deleted) { 
            return false;
        }
        if (this.state === actionState.write) { 
            this.readQue.push([workerId, requestId, cb]);
            return true;
        }
        this.state = actionState.read; //
        if (this.read.acquire(workerId)) {
            this.callHook(hooks.ON_READ_ACQUIRE, { workerId, requestId });
            cb(this.dataId, () => {
                this.releaseRead(workerId, requestId);
            });
        } else {
            this.readQue.push([workerId, requestId, cb]);
        }        
        return true;
    }

    private doReadFromQue() { 
        const newItem = this.readQue.shift();
        if (newItem) {
            return this.acquireRead(newItem[0], newItem[1], newItem[2]);
        } else if (this.read.getSize() === 0) {
            if (this.write.length === 0 && !this.writing) {
                nextTick(() => {
                    this.state = actionState.readWriteEmpty;
                    return this.tryDelete();
                });
            } else if (!this.writing) {
                nextTick(() => {
                    this.state = actionState.write;
                    return this.executeWrite();
                });
            }
        }
    }

    public releaseRead(workerId: string, requestId: string) {
        if (!this.read.release(workerId)) { 
            return false;
        }
        this.callHook(hooks.ON_READ_RELEASE, { workerId, requestId });
        nextTick(() => this.doReadFromQue());
        return true;
    }

    public cleanRead(workerId: string | void) {
        if (!workerId) {
            this.read.clean();
            this.readQue.clean();
        } else {
            this.read.clean(workerId);
            this.readQue.remove(([itemWorkerId]) => itemWorkerId === workerId);
        }
        this.doReadFromQue();
    }

    private executeWrite() {
        if (this.state !== actionState.write || this.writing) {
            return false;
        }
        const item = this.write.shift();
        if (item) {
            const [workerId, requestId, cb] = item;
            this.writing = true;
            this.callHook(hooks.ON_WRITE_ACQUIRE, { workerId, requestId });            
            cb(this.dataId, () => {
                this.writing = false;
                this.executeWrite();
                this.callHook(hooks.ON_WRITE_RELEASE, { workerId, requestId });
            });
        } else {
            this.state = actionState.read;
            this.doReadFromQue();
        }
        return true;
    }

    public hookWrite(workerId: string, requestId: string, cb: actionCB): boolean { 
        if (this.state === actionState.deleted) { 
            return false;
        }
        this.write.push([workerId, requestId, cb]);
        this.executeWrite();
        return true;
    }

    public cleanWrite(workerId: string | void) {
        if (!workerId) {
            this.write.clean();
        } else {
            this.write.remove(([itemWorkerId]) => itemWorkerId === workerId);
        }
    }

    private tryDelete(): boolean { 
        if (this.state < actionState.readWriteEmpty) {
            return false;
        }
        const delItem = this.del.shift();
        if (delItem) { 
            const [workerId, requestId, cb] = delItem;            
            this.callHook(hooks.ON_UNLINK_ACQUIRE, { workerId, requestId });
            cb(this.dataId);
            this.state = actionState.deleted;
            this.tryDelete();
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
        } else {
            this.del.remove(([itemWorkerId]) => itemWorkerId === workerId);
        }
    }
}
