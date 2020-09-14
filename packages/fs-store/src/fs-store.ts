import { IFSStore } from '@testring/types';
import { readFileSync, readFile, unlink, unlinkSync } from 'fs';


export class FSStore implements IFSStore {

    private lockHash: Map<string, boolean> = new Map();

    constructor(public fName: string) {}

    // reading file from disk and pass a return a buffer, raise error if file is removed
    readSync(): Buffer {
        return readFileSync(this.fName);
    }
    
    // reading file from disk and pass a return with promise wrapper
    read(): Promise<Buffer> {
        return new Promise((res, rej)=>{
            readFile(this.fName, (err, data) => {
                if (err) {
                    return rej(err);
                }
                res(data);
            });
        });
    }

    // locks file for remove, key is used as identifier for unlock in future
    lock(id: string): boolean {
        if (this.lockHash.has(id)) {
            return false;
        }
        this.lockHash.set(id, true);
        return true;
    }
    // unlocks file for remove operation
    unlock(id: string) {        
        this.lockHash.delete(id);        
    }
    // returns bool variable, true if nobody locks current file
    isLocked(): boolean {
        return this.lockHash.size > 0;
    }
    // removing file from file system, raise error if file is locked
    removeSync() {
        if (this.isLocked()) {
            throw new Error('Unable to remove locked file');
        }
        return unlinkSync(this.fName);
    }
     
    // async remove method 
    remove(): Promise<boolean> {
        return new Promise((res, rej)=>{
            unlink(this.fName, (err)=>{
                if (err) {
                    return rej(err);
                }
                res();
            });
        });
    }
}
