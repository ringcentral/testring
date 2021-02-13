/**
 * file reader abstraction with ability to lock file for not be able to delete it
 * fullFileName or savePath should be passed at init time
 * if no fileName is not passed, savePath should be passed at init & fileName will be generated!
 * has a hook for event of all locks OFF (onLockFree(id, cb)) - to subscribe to the event
 */

import * as  fs from 'fs';

import { FSStoreClient } from './fs-store-client';

import { IFSStoreFile, FSStoreOptions, FSUnlockOptions } from '@testring/types';
import { generateUniqId } from '@testring/utils';


import { getNewLog, touchFile } from './utils';

const logger = getNewLog({ m: 'fsf' });

import * as path from 'path';


const { appendFile, writeFile, readFile, unlink, stat } = fs.promises;

const defaultOptions = { lock: false };
export class FSStoreFile implements IFSStoreFile {

    private state: Record<string, any> = {};

    private fsWriterClient: FSStoreClient;

    private fullFileName: string;
    private fileSavePath: string;

    private initPromise: Promise<void>;

    private options: FSStoreOptions;

    constructor(options: FSStoreOptions) {
        this.options = { ...defaultOptions, ...options };
        this.state.valid = true;
        this.fsWriterClient = new FSStoreClient(options.fsStorePrefix);
        this.initPromise = this.init();
    }

    private async init() {
        this.fullFileName = await this.ensureFile(this.options.file);
        if (this.options.lock) {
            await this.lock();
        }
    }

    private async ensureFile(fileData: string | { fileName?: string; savePath: string }) {

        logger.debug({ fileData }, 'ensureFile');
        if (typeof fileData === 'string' || fileData.fileName !== undefined) {
            let fName: string;
            if (typeof fileData === 'string') {
                this.fullFileName = fileData;
                this.fileSavePath = path.dirname(fileData);

                fName = fileData;
            } else {
                this.fileSavePath = fileData.savePath;
                fName = path.join(fileData.savePath, fileData.fileName || ''); // || '' - avoid TS error 
            }
            await touchFile(fName);
            this.state.fileEnsured = true;
            return fName;
        }
        this.fileSavePath = fileData.savePath;
        this.state.fileEnsured = false;
        return '';
    }

    /**
     * ensure internal state for object is corresponding to file system
     * @param fName 
     */
    private async fixShortFile(fName: string) {
        if (this.state.fileEnsured === false) {
            this.state.fileEnsured = true;
            this.fullFileName = fName;
            this.fileSavePath = path.dirname(fName);
            logger.info('before touch');
            await touchFile(fName);
        }
    }


    async lock() {
        if (this.state.inTransaction) {
            return;
        }
        await this.initPromise;

        return new Promise<void>((res) => {
            this.state.lockId = this.fsWriterClient.getLock(
                { fileName: this.fullFileName || undefined, path: this.fileSavePath },
                async (fName) => {
                    await this.fixShortFile(fName);
                    res();
                },
            );
        });
    }

    /**
     * 
     * @param options - {unlink - sign up for unlink }
     * @returns
     */
    async unlock(options: FSUnlockOptions = { doUnlink: false }): Promise<boolean> {
        logger.info({ state: this.state }, 'in unlock');

        if (this.state.inTransaction) {
            return false;
        }
        if (!this.state.lockId) {
            return false;
        }
        await this.release(this.state.lockId);
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
    private async getAccess() {
        if (this.state.inTransaction) {
            return;
        }
        await this.initPromise;
        return new Promise<void>((res) => {
            this.state.accessId = this.fsWriterClient.getAccess(
                { fileName: this.fullFileName || undefined, path: this.fileSavePath },
                async (fName) => {
                    await this.fixShortFile(fName);
                    res();
                },
            );
        });
    }

    /**
     * ensure we get access right for 
     * @returns
     */
    private async release(id: string): Promise<boolean> {
        if (this.state.inTransaction) {
            return false;
        }
        if (!id) {
            return false;
        }
        return new Promise<boolean>((res) => {
            logger.debug('in release promise');
            this.fsWriterClient.release(id, () => {
                res(true);
            });
        });
    }

    private async releaseAccess() {
        const res = await this.release(this.state.accessId);
        this.state.accessId = null;
        return res;
    }

    async read(): Promise<Buffer> {
        await this.initPromise;
        await this.getAccess();
        const res = await readFile(this.fullFileName);
        await this.releaseAccess();
        return res;
    }
    async write(data: Buffer): Promise<void> {
        await this.initPromise;
        await this.getAccess();
        await writeFile(this.fullFileName, data);
        await this.releaseAccess();
    }
    async append(data: Buffer): Promise<void> {
        await this.initPromise;
        await this.getAccess();
        await appendFile(this.fullFileName, data);
        await this.releaseAccess();
    }

    async stat(): Promise<fs.Stats> {
        await this.initPromise;
        await this.getAccess();
        const res = await stat(this.fullFileName);
        await this.releaseAccess();
        return res;
    }

    // returns bool variable, true if nobody locks current file
    isLocked(): boolean {
        return !!this.state.lockId;
    }

    isValid = () => this.state.valid;

    /**
     */
    waitForUnlock(): Promise<void> {
        return new Promise<void>((res) => {
            const requestId = generateUniqId(10);
            this.fsWriterClient.getUnlink(
                { fileName: this.fullFileName, requestId },
                async () => {
                    this.fsWriterClient.release(requestId);
                    res();
                },
            );
        });
    }

    // async remove method - need to call writeLock before call remove
    unlink(): Promise<boolean> {
        logger.debug({ state: this.state }, 'in unlink');

        return new Promise<boolean>((res) => {
            const requestId = generateUniqId(10);
            this.fsWriterClient.getUnlink(
                { fileName: this.fullFileName, requestId },
                async () => {
                    if (!this.isValid()) {
                        res(false);
                    }
                    await unlink(this.fullFileName);
                    this.fsWriterClient.release(requestId);
                    this.state.valid = false;
                    res(true);
                },
            );
        });
    }

    async transaction(cb: () => Promise<void>, unlockOpt: FSUnlockOptions = { doUnlink: false }) {
        await this.lock();
        await this.getAccess();
        this.state.inTransaction = true;
        try {
            await cb();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e, 'Error during ');
        }
        this.state.inTransaction = false;
        await this.releaseAccess();
        await this.unlock(unlockOpt);
    }
}
