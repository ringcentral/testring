import { IFSStore } from '@testring/types';
import { readFileSync, readFile, unlink, unlinkSync } from 'fs';


export class FSStore implements IFSStore {

    private state: Record<string, any> = {};
    
    private exclusiveLockId: string | null = null;
    private exclusiveLockQue: { id: string; resolve: (boolean) => void; reject: (boolean) => void }| null = null;

    private lockHash: Map<string, boolean> = new Map();

    constructor(public fileName: string) {
        this.state.valid = true;
    }

    // reading file from disk and pass a return a buffer, raise error if file is removed
    readSync(): Buffer {
        return readFileSync(this.fileName);
    }
    
    // reading file from disk and pass a return with promise wrapper
    read(): Promise<Buffer> {
        return new Promise((res, rej)=>{
            readFile(this.fileName, (err, data) => {
                if (err) {
                    return rej(err);
                }
                res(data);
            });
        });
    }

    // locks file for read, key is used as identifier for unlock in future
    lock(id: string): boolean {
        if (this.isLocked(true)) { 
            throw new Error('Write Lock in progress');
        }
        if (this.lockHash.has(id)) {
            return false;
        }
        this.lockHash.set(id, true);
        return true;
    }
    // unlocks file for read operation
    unlock(id: string) {        
        this.lockHash.delete(id);
        // perform write lock if it is in the que
        if (!this.isLocked() && this.exclusiveLockQue !== null) { 
            this.exclusiveLockQue.resolve(true);
            this.exclusiveLockQue = null;
        }
    }
    // returns bool variable, true if nobody locks current file
    isLocked(hasWriteLock: boolean = false): boolean {
        return hasWriteLock
            ? this.exclusiveLockId !== null
            : this.lockHash.size > 0 && this.exclusiveLockId !== null;
    }

    isValid = () => this.state.valid;

    /**
     * locks file for write/remove - exclusive lock, 
     * if exclusive lock is taken or in process or flag (returnOnReadLock) is set than returns false 
     * @param {String} id - id of process that wants to lock  
     * @param {boolean} returnOnReadLock - return false if read lock is present
     * @returns {Promise<boolean>} - 
     */
    async writeLock(id: string, returnOnReadLock=false) { 
        if (this.isLocked(!returnOnReadLock)) { 
            throw new Error('Lock is in progress');
        }
        if (this.isLocked() && this.exclusiveLockQue === null) {
            return new Promise<boolean>((resolve, reject) => {
                this.exclusiveLockQue = { id, resolve, reject };
            });
        } else if (this.exclusiveLockQue !== null) { 
            throw new Error('Other write lock is in progress');
        }
        this.exclusiveLockId = id;
        return true;
    }

    /**
     * unlock file for write/remove - unlock exclusive lock
     * 
     * @param id - a process id that tries to unlock 
     * @param {string|null} [newFileName=null] - new name of file to be used by object (in case of moving file), if falsy - no change 
     * @param {boolean} [valid=true] - will object be valid after change
     * @returns {boolean} - true if change have been performed else false (case of wrong ID) 
     */
    writeUnlock(id: string, newFileName: string|null= null, valid=true) { 
        if (this.exclusiveLockId === id) { 
            this.exclusiveLockId = null;
            this.state.valid = valid;
            if (newFileName && valid) {
                this.fileName = newFileName;
            }
            return true;
        }
        return false;
    }

    // removing file from file system, raise error if file is locked
    removeSync(id: string) {
        if (this.isLocked() && this.exclusiveLockId !== id) {
            throw new Error('Unable to remove locked file');
        }
        this.state.valid = false;
        return unlinkSync(this.fileName);
    }
     
    // async remove method - need to call writeLock before call remove
    remove(id: string): Promise<boolean> {
        if (this.isLocked() && this.exclusiveLockId !== id) {
            throw new Error('Unable to remove locked file');
        }
        return new Promise((res, rej)=>{
            unlink(this.fileName, (err)=>{
                if (err) {
                    return rej(err);
                }
                res(true);
            });
        });
    }
}
