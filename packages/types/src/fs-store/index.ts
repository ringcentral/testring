
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
    unlock(options: FSUnlockOptions): Promise<boolean>; // unlocks file to read operation for process ID
    read(): Promise<Buffer>; // the same part but with promise wrapper
    write(Buffer): Promise<void>; // the same part but with promise wrapper
    append(Buffer): Promise<void>; // the same part but with promise wrapper
    isLocked(): boolean; // returns bool variable, true if nobody locks current file
    unlink(): Promise<boolean>;// async remove method
    waitForUnlock(): Promise<void>; //
    transaction(cb: () => Promise<void>): Promise<void>;
}

export interface IQueAcqReq {
    requestId: string;
}

export interface IQueAcqResp {
    requestId: string;
}

export type IQueStateReq = IQueAcqReq
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
export interface IFSStoreReq {
    requestId: string;
    action: fsReqType;
    fileName?: string;
    meta: Record<string, any>;
}

export interface IFSStoreReq {
    requestId: string;
    action: fsReqType;
    fileName?: string;
    meta: Record<string, any>;
}
export interface IFSStoreReqFixed {
    requestId: string;
    action: fsReqType;
    fileName: string;
    meta: Record<string, any>;
}
export interface IFSStoreResp {
    requestId: string;
    action: fsReqType;
    fileName: string;
    status: string;
}


export type FSStoreOptions = {
    lock?: boolean;
    file: string | {
        fileName?: string;
        savePath: string;
        ext?: string;
    };
    fsStorePrefix?: string;
}

export type FSUnlockOptions = {
    doUnlink?: boolean;
}

export interface IOnFileReleaseHookData {
    workerId: string;
    requestId: string;
}

export interface IOnFileNameHookData {
    workerId: string;
    requestId: string;
    fileName: string;
    path: string;
}
