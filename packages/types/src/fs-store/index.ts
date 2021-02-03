
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

export interface IFSStore {
    readSync(): Buffer; // reading file from disk and pass a return a buffer, raise error if file is removed
    read(): Promise<Buffer>; // the same part but with promise wrapper
    lock(id: string): boolean; // locks file for read, ID key is used as identifier for unlock in future
    unlock(id: string); // unlocks file to read operation for process ID
    onLockFree(id: string, cb: (IFSStore) => void): boolean; // subscribe to all unlock event 
    isLocked(): boolean; // returns bool variable, true if nobody locks current file
    unlinkSync(id: string); // remove file from FS, raise an error if file is locked or object is invalid
    unlink(id: string): Promise<boolean>;// async remove method 
}

export interface IQueAcqReq {
    requestId: string;
}

export interface IQueAcqResp {
    requestId: string;
    id: string;
}

export type IQueTestReq = IQueAcqReq
export interface IQueTestResp {
    requestId: string;
    state: string;
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
    'read',
    'write',
    'unlink',
}
export interface IFSStoreReq {
    requestId: string;
    action: fsReqType;
    fileName?: string;
    meta: Record<string,any>;
}
export interface IFSStoreResp {
    requestId: string;
    action: fsReqType;
    fileName: string;
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
