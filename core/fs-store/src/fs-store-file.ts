/**
 * file reader abstraction with ability to lock file for not be able to delete it
 * fullPath or savePath should be passed at init time
 * if no fileName is not passed, savePath should be passed at init & fileName will be generated!
 * has a hook for event of all locks OFF (onLockFree(id, cb)) - to subscribe to the event
 */

import * as fs from 'fs';
import * as path from 'path';
import {IFSStoreFile, FSStoreOptions, requestMeta} from '@testring/types';
import {loggerClient} from '@testring/logger';
import {fs as fsTool} from '@testring/utils';

import {FSStoreClient} from './fs-store-client';

import FSClientGet from './fs-store-client-fabric';

const log = loggerClient.withPrefix('fsf');

const {appendFile, writeFile, readFile, unlink, stat} = fs.promises;

export type ActionOptionsType = {
    meta: requestMeta & {workerId?: string};
    opts?: Record<string, any>;
};

const defaultOptions = {lock: false};
export class FSStoreFile implements IFSStoreFile {
    private state: Record<string, any> = {};

    private fsWriterClient: FSStoreClient;

    private fullPath: null | string = null;
    private fileMeta: Record<string, any>;

    private initPromise: Promise<void>;
    private transactionQueue: Array<(any?) => void> = [];
    private lockQueue: Array<string> = [];

    private options: FSStoreOptions;

    constructor(options: FSStoreOptions) {
        this.options = {...defaultOptions, ...options};
        this.state.valid = true;
        this.fsWriterClient = FSClientGet(options.fsStorePrefix);
        this.fileMeta = options.meta; // meta:{fileName, ...}
        this.initPromise = this.init();
    }

    private async init() {
        if (this.options.lock) {
            await this.lock();
        } else {
            await this.ensureName();
        }
    }

    // ------- STATIC METHODS
    public static async write(
        data: Buffer,
        options: FSStoreOptions,
    ): Promise<string> {
        const file = new FSStoreFile(options);
        await file.write(data);
        return file.getFullPath() as string;
    }
    public static async append(
        data: Buffer,
        options: FSStoreOptions,
    ): Promise<string> {
        const file = new FSStoreFile(options);
        await file.append(data);
        return file.getFullPath() as string;
    }
    public static async unlink(options: FSStoreOptions): Promise<string> {
        const file = new FSStoreFile(options);
        await file.unlink();
        return file.getFullPath() as string;
    }
    public static async read(options: FSStoreOptions): Promise<Buffer> {
        const file = new FSStoreFile(options);
        return await file.read();
    }

    // ------- INSTANCE METHODS

    // FIXME: allow getting name without lock/unlock operations
    private async ensureName() {
        return new Promise<void>((res) => {
            this.fsWriterClient.getLock(
                {
                    ...this.fileMeta,
                },
                async (fullPath, lockId) => {
                    this.fullPath = fullPath;
                    this.fileMeta.fileName = path.basename(fullPath);
                    if (lockId) {
                        this.fsWriterClient.release(lockId, () => {
                            res();
                        });
                    }
                },
            );
        });
    }

    private async ensureFile() {
        if (this.fullPath === null) {
            throw new Error('try to ensure null file');
        }
        if (this.state.fileEnsured !== this.fullPath) {
            const fileSavePath = path.dirname(this.fullPath);
            await fsTool.ensureDir(fileSavePath);
            await fsTool.touchFile(this.fullPath);
            this.state.fileEnsured = this.fullPath;
            return true;
        }
        return false;
    }

    public getState = () => this.state;
    public getFullPath = () => this.fullPath;

    async lock() {
        if (this.state.inTransaction) {
            return;
        }
        await this.initPromise;

        return new Promise<void>((res) => {
            this.fsWriterClient.getLock(
                {
                    ...this.fileMeta,
                },
                async (fullPath, lockId) => {
                    this.fullPath = fullPath;
                    this.fileMeta.fileName = path.basename(fullPath);
                    if (lockId) {
                        this.lockQueue.push(lockId);
                    }
                    await this.ensureFile();
                    res();
                },
            );
        });
    }

    /**
     *
     * @returns
     */
    async unlock(): Promise<boolean> {
        if (this.state.inTransaction) {
            return false;
        }
        if (!this.lockQueue.length) {
            return false;
        }

        const lockId = this.lockQueue.pop();
        if (lockId && !(await this.release(lockId))) {
            this.lockQueue.push(lockId);
        }
        return true;
    }

    async unlockAll(): Promise<boolean> {
        if (this.state.inTransaction) {
            return false;
        }
        await Promise.all(this.lockQueue.map((lockId) => this.release(lockId)));

        return true;
    }

    /**
     * ensure we get exclusive access right for a file
     * @returns
     */
    async getAccess() {
        if (this.state.inTransaction) {
            return;
        }
        await this.initPromise;
        return new Promise<void>((res) => {
            this.fsWriterClient.getAccess(
                {
                    ...this.fileMeta,
                },
                async (fullPath, accessId) => {
                    this.fullPath = fullPath;
                    this.fileMeta.fileName = path.basename(fullPath);
                    this.state.accessId = accessId;
                    await this.ensureFile();
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
        return new Promise<boolean>((res, rej) => {
            this.fsWriterClient.release(id, (fullPath) => {
                fullPath === '' ? rej(false) : res(true);
                // fullPath === '' ? res(false) : res(true);
            });
        });
    }

    async releaseAccess() {
        const res = await this.release(this.state.accessId);
        if (res) {
            this.state.accessId = null;
        }
        return res;
    }

    async read(): Promise<Buffer> {
        await this.initPromise;
        await this.getAccess();
        const res = await readFile(this.fullPath as string);
        await this.releaseAccess();
        return res;
    }
    async write(data: Buffer): Promise<string> {
        await this.initPromise;
        await this.getAccess();
        await writeFile(this.fullPath as string, data, this.options.fsOptions);
        await this.releaseAccess();
        return this.getFullPath() as string;
    }

    async append(data: Buffer): Promise<string> {
        await this.initPromise;
        await this.getAccess();
        await appendFile(this.fullPath as string, data, this.options.fsOptions);
        await this.releaseAccess();
        return this.getFullPath() as string;
    }

    async stat(): Promise<fs.Stats> {
        await this.initPromise;
        await this.getAccess();
        const res = await stat(this.fullPath as string);
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
            this.fsWriterClient.getUnlink(
                {...this.options.meta},
                async (_, requestId) => {
                    if (requestId) {
                        this.fsWriterClient.release(requestId);
                    }
                    res();
                },
            );
        });
    }

    // async remove method - need to call writeLock before call remove
    unlink(): Promise<boolean> {
        if (this.state.enterTransaction) {
            throw new Error('Cannot unlink during transaction');
        }

        return new Promise<boolean>((res) => {
            this.fsWriterClient.getUnlink(
                {...this.options.meta},
                async (fullPath, requestId) => {
                    if (!this.isValid()) {
                        res(false);
                    }
                    await unlink(fullPath);
                    if (requestId) {
                        this.fsWriterClient.release(requestId);
                    }
                    this.state.valid = false;
                    res(true);
                },
            );
        });
    }

    async transaction(cb: () => Promise<void>) {
        await this.startTransaction();
        try {
            await cb();
        } catch (e) {
            log.error(e, 'Error during transaction');
        }
        await this.endTransaction();
    }

    async startTransaction() {
        if (this.state.enterTransaction) {
            const waitFor = new Promise((res) => {
                this.transactionQueue.push(res);
            });
            await waitFor;
        }
        this.state.enterTransaction = true;
        await this.getAccess();
        await this.lock();
        this.state.inTransaction = true;
    }

    async endTransaction() {
        this.state.inTransaction = false;
        await this.releaseAccess();
        await this.unlock();
        this.state.enterTransaction = false;
        // start next transaction in queue
        if (this.transactionQueue.length) {
            const res = this.transactionQueue.shift();
            res && res();
        }
    }
}
