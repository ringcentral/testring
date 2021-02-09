/**
 * file reader abstraction with ability to lock file for not be able to delete it
 * fullFileName or savePath should be passed at init time
 * if no fileName is not passed, savePath should be passed at init & fileName will be generated!
 * has a hook for event of all locks OFF (onLockFree(id, cb)) - to subscribe to the event
 */


import { appendFile, writeFile, readFile, unlink, open, stat } from 'fs/promises';
import { constants as fsConstants, Stats as fsStats} from 'fs';

import { FSStoreClient } from './fs-store-client';

import { IFSStore, FSStoreOptions, FSUnlockOptions } from '@testring/types';
import { generateUniqId }  from '@testring/utils';

import path from 'path';


const defaultOptions = {lock:false}
export class FSStore implements IFSStore {

    private state: Record<string, any> = {};

    private fsWriterClient: FSStoreClient;

    private fullFileName: string;
    private shortFileName: string| null = null;
    private fileSavePath: string;

    private initPromise: Promise<void>; 

    private options: FSStoreOptions;
    
    constructor(options: FSStoreOptions) {
        this.options = { ...defaultOptions, ...options };
        this.state.valid = true;
        this.fsWriterClient = new FSStoreClient();
        this.initPromise = this.init();
    }

    private async init() { 
        this.fullFileName = await this.ensureFile(this.options.file);
        if (this.options.lock) { 
            await this.lock()
        }
    }

    private async ensureFile(fileData: string | { fileName?: string, savePath: string }) { 
        
        if (typeof fileData === 'string' || fileData.fileName !== undefined) {
            let fName: string;
            if (typeof fileData === 'string') {
                this.fullFileName = fileData;
                this.fileSavePath = path.dirname(fileData);

                fName = fileData;
            } else { 
                this.fileSavePath = fileData.savePath;
                this.shortFileName = fileData.fileName || '';// || '' - needed for TS error suppression
                fName = path.join(fileData.savePath, fileData.fileName || ''); // || '' - needed for TS error suppression
            } 
            await this.touchFile(fName)
            this.state.fileEnsured = true;
            return fName;
        } 
        this.fileSavePath = fileData.savePath;
        this.state.fileEnsured = false;
        return '';        
    }

    private async touchFile(fName: string) { 
        return open(fName, fsConstants.R_OK | fsConstants.W_OK).then(fHandle => fHandle.close())
    }

    /**
     * ensure internal state for object is corresponding to file system
     * @param fName 
     */
    private async fixShortFile(fName: string) { 
        if (this.state.fileEnsured === false) {
            this.state.fileEnsured = true;
            this.fullFileName = fName;
            this.shortFileName = path.basename(fName);
            this.fileSavePath = path.dirname(fName);
            await this.touchFile(fName)
        }
    }


    async lock() {
        if (this.state.inTransaction) { 
            return;
        }
        await this.initPromise;
        
        return new Promise<void>((res) => {
            this.state.lockId = this.fsWriterClient.getLockPermission(async (fName) => {
                await this.fixShortFile(fName);
                res()
            },
            {fileName:this.fullFileName || undefined, path:this.fileSavePath });
        })
    }

    /**
     * 
     * @param options - {unlink - sign up for unlink }
     * @returns
     */
    async unlock(options: FSUnlockOptions = {doUnlink: false}): Promise<boolean> {
        if (this.state.inTransaction) { 
            return false;
        }
        if (!this.state.lockId) { 
            return false;
        }
        await this.releasePermission(this.state.lockId)
        this.state.lockId = null;
        
        if (options.doUnlink) {
            await this.unlink();
        } 
        return true;        
    }

    /**
     * ensure we get access right for 
     * @returns
     */
    private async getAccessPermission() {
        if (this.state.inTransaction) { 
            return;
        }
        await this.initPromise;
        return new Promise<void>((res) => {
            this.state.accessId = this.fsWriterClient.getAccessPermission(async (fName) => {
                await this.fixShortFile(fName);
                res()
            },
            {fileName:this.fullFileName || undefined});
        })
    }
    
    /**
     * ensure we get access right for 
     * @returns
     */
    private async releasePermission(id: string): Promise<boolean> { 
        if (this.state.inTransaction) { 
            return false;
        }
        if (!id) { 
            return false;
        }
        return new Promise<boolean>((res) => {
            this.fsWriterClient.releasePermission(id, () => {
                res(true);
            });
        })
    }

    private async releaseAccessPermission() { 
        const res = await this.releasePermission(this.state.accessId);
        this.state.accessId = null;
        return res;
    }

    async read(): Promise<Buffer> {
        await this.initPromise;
        await this.getAccessPermission();
        const res = await readFile(this.fullFileName);
        await this.releaseAccessPermission()
        return res;
    }
    async write(data: Buffer): Promise<void>{
        await this.initPromise;
        await this.getAccessPermission();
        await writeFile(this.fullFileName, data);
        await this.releaseAccessPermission();
    }
    async append(data:Buffer):Promise<void> {
        await this.initPromise;
        await this.getAccessPermission();
        await appendFile(this.fullFileName, data);
        await this.releaseAccessPermission();
    }
    
    async stat(): Promise<fsStats> {
        await this.initPromise;
        await this.getAccessPermission();
        const res = await stat(this.fullFileName);
        await this.releaseAccessPermission();
        return res;
    }
    
    // returns bool variable, true if nobody locks current file
    isLocked(): boolean {
        return !!this.state.lockId;
    }

    isValid = () => this.state.valid;

    /**
     */
    waitForUnlock():Promise<void> { 
        return new Promise<void>((res) => {
            const requestId = generateUniqId(10);
            this.fsWriterClient.getUnlinkPermission(async () => {
                this.fsWriterClient.releasePermission(requestId)
                res();
            }, {
                    fileName: this.fullFileName,
                    requestId,                
            })
        })
    }
     
    // async remove method - need to call writeLock before call remove
    unlink(): Promise<boolean> {
        return new Promise<boolean>((res) => {
            const requestId = generateUniqId(10);
            this.fsWriterClient.getUnlinkPermission(async () => {
                if (!this.isValid()) { 
                    res(false);
                }
                await unlink(this.fullFileName)
                this.fsWriterClient.releasePermission(requestId)
                this.state.valid = false;
                res(true);
            }, {
                fileName: this.fullFileName
            })
        })
    }

    async transaction(cb: () => Promise<void>, unlockOpt: FSUnlockOptions = { doUnlink: false}) { 
        await this.lock();
        await this.getAccessPermission()
        this.state.inTransaction = true;
        await cb();
        this.state.inTransaction = false;
        await this.releaseAccessPermission();
        await this.unlock(unlockOpt);        
    }
}
