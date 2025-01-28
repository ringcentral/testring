export const enum FSFileType {
    BINARY = 0,
    TEXT = 1,
}

export const enum FSFileLogType {
    SCREENSHOT = 1,
    TEXT = 2,
}

export const enum FSFileEncoding {
    NONE = 0,
    BASE64 = 1,
}

export interface IFSFile {
    path: string;
    type: FSFileType;
    encoding: FSFileEncoding;
    content: string;
}

export interface IFSStoreFile {
    lock(): Promise<void>; // locks file for read, ID key is used as identifier for unlock in future
    unlock(options: FSActionOptions): Promise<boolean>; // unlocks file to read operation for process ID
    read(): Promise<Buffer>; // the same part but with promise wrapper
    write(Buffer): Promise<string>; // the same part but with promise wrapper, returns fullPath
    append(Buffer): Promise<string>; // the same part but with promise wrapper, returns fullPath
    isLocked(): boolean; // returns bool variable, true if nobody locks current file
    unlink(): Promise<boolean>; // async remove method
    waitForUnlock(): Promise<void>; //
    transaction(cb: () => Promise<void>): Promise<void>;
}

export interface IQueAcqReq {
    requestId: string;
}

export interface IQueAcqResp {
    requestId: string;
}

export type IQueStateReq = IQueAcqReq;
export interface IQueStateResp {
    requestId: string;
    state: Record<string, any>;
}

export interface IChgAcqReq {
    requestId: string;
    fileName?: string;
}
export interface IChgAcqResp {
    requestId: string;
    fileName: string;
}
export interface IDelAcqReq {
    requestId: string;
    fileName: string;
}
export interface IDelAcqResp {
    requestId: string;
    fileName: string;
}

export enum fsReqType {
    'access' = 1,
    'lock',
    'unlink',
    'release',
}

export enum FSFileUniqPolicy {
    'global',
    'worker',
}

export enum FSStoreType {
    screenshot = 'screenshot', // binary
    globalText = 'globalText', // text
    globalBin = 'globalBin', // binary
    text = 'text',
    bin = 'bin',
}

type BaseReqMeta = {
    type?: FSStoreType; // simple file will be created in /tmp
    subtype?: string | string[];
    extraPath?: string;
    global?: boolean; // global file - assume fileName as fullPath
    preserveName?: boolean; // construct ony path & use fileName with out addons
    uniqPolicy?: FSFileUniqPolicy; //
    workerId?: string;
};

export type requestMeta = BaseReqMeta & {
    fileName?: string; // no path
    ext?: string; // by default 'tmp'
};

export interface IFSStoreReq {
    requestId: string;
    action: fsReqType;
    meta: requestMeta;
}

export interface IFSStoreResp {
    requestId: string;
    action: fsReqType;
    fullPath: string;
    status: string;
}

export type FSStoreDataOptions = {
    lock?: boolean;
    fsOptions?: {encoding: BufferEncoding; flag?: string};
    fsStorePrefix?: string;
};

export type FSStoreOptions = FSStoreDataOptions & {
    meta: requestMeta;
};

export type FSActionOptions = {
    doUnlink?: boolean;
    waitForUnlink?: boolean;
};

export interface IOnFileReleaseHookData {
    workerId: string;
    requestId: string;
}

export interface IOnFileNameHookData {
    workerId: string;
    requestId: string;
    fileName: string;
    meta: requestMeta;
}

export interface ILockPool {
    acquire(workerId: string, requestId?: string): Promise<boolean>;
    release(workerId: string, requestId?: string): boolean;
    clean(workerId: string, requestId?: string): void;
    getState(): {
        curLocks: number;
        maxLocks: number;
        lockQueueLen: number;
        locks: Map<string, number>;
    };
}
