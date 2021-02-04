/**
 * file reader abstraction with ability to lock file for not be able to delete it
 * file path is passed at init
 * has a hook for event of all locks OFF (onLockFree(id, cb)) - to subscribe to the event
 */


import { promisify } from 'util';

import { appendFile, writeFile, readFile, unlink } from 'fs/promises';
import { readFileSync,  unlinkSync } from 'fs';

import { FSStoreClient } from './fs-store-client';

import { IFSStore, FSStoreOptions } from '@testring/types';


const defaultOptions = {lock:false}
export class FSStore implements IFSStore {

    private state: Record<string, any> = {};
    
    private exclusiveLockQue: Record<string, (IFSStore) => void> = {};

    private lockHash: Map<string, boolean> = new Map();

    private cache: Buffer | null = null;

    private fsWriterClient: FSStoreClient;

    private fileName: string;

    constructor(options:FSStoreOptions= defaultOptions) {
        this.state.valid = true;
        this.fsWriterClient = new FSStoreClient();
        this.fileName = options.fileName 
    }

    
    // reading file from disk and pass a return a buffer, raise error if file is removed
    readSync(): Buffer {
        if (!this.cache) {
            this.cache = readFileSync(this.fileName);
        }
        return this.cache;
    }
    
    // reading file from disk and pass a return with promise wrapper
    read(): Promise<Buffer> {
        return new Promise((res, rej) => {
            if (this.cache) {
                return res(this.cache);
            }
            readFile(this.fileName, (err, data) => {
                if (err) {
                    return rej(err);
                }
                this.cache = data;
                res(data);
            });
        });
    }

    // locks file for read, key is used as identifier for unlock in future
    lock(id: string): boolean {
        if (!this.isValid()) { 
            throw new Error('Unable to lock invalid file');
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
        if (!this.isLocked()) { 
            Object.values(this.exclusiveLockQue)
                .forEach(cb => cb(this));
            this.exclusiveLockQue = {};
        }
    }
    // returns bool variable, true if nobody locks current file
    isLocked(): boolean {
        return this.lockHash.size > 0;
    }

    isValid = () => this.state.valid;
    invalidateCache = () => this.cache = null;

    /**
     * if locked, puts cb in the pool of waiters for the event 
     * if NOT locked, executes cb imediatlly 
     * @param {String} id - id of process that wants to wait  
     * @param {(IFSStore)=>void} cb - call on all unlock
     * @returns {boolean} - 
     */
    onLockFree(id: string, cb: (obj: IFSStore) => void) { 
        if (!this.isLocked()) { 
            cb(this);
            return false;
        }
        this.exclusiveLockQue[id] = cb;
        
        return true;
    }


    // removing file from file system, raise error if file is locked
    unlinkSync(id: string) {
        if (!this.isValid()) { 
            throw new Error('Unable to remove invalid file');
        }
        if (this.isLocked()) {
            throw new Error('Unable to remove locked file');
        }
        this.state.valid = false;
        return unlinkSync(this.fileName);
    }
     
    // async remove method - need to call writeLock before call remove
    unlink(id: string): Promise<boolean> {
        if (!this.isValid()) { 
            throw new Error('Unable to remove invalid file');
        }
        if (this.isLocked()) {
            throw new Error('Unable to remove locked file');
        }
        return new Promise((res, rej)=>{
            unlink(this.fileName, (err)=>{
                if (err) {
                    return rej(err);
                }
                this.state.valid = false;
                res(true);
            });
        });
    }
}
