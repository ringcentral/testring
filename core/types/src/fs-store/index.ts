export const enum FSFileType {
    BINARY = 0,
    TEXT = 1,
}

export const enum FSFileLogType {
    SCREENSHOT = 1,
    COVERAGE = 2,
    TEXT = 3,
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
    write(Buffer): Promise<void>; // the same part but with promise wrapper
    append(Buffer): Promise<void>; // the same part but with promise wrapper
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

type BaseReqMeta = {
    type?: string; // simple file will be created in /tmp
    subtype?: string | string[];
    extraPath?: string;
    uniqPolicy?: FSFileUniqPolicy;
    options?: Record<string, any>;
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

export type FSStoreOptions = {
    lock?: boolean;
    meta: requestMeta;
    fsOptions?: {encoding: BufferEncoding; flag?: string};
    fsStorePrefix?: string;
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
