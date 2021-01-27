
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
    fileName: string; // absolute file path
    readSync(): Buffer; // reading file from disk and pass a return a buffer, raise error if file is removed
    read(): Promise<Buffer>; // the same part but with promise wrapper
    lock(id: string): boolean; // locks file for read, key is used as identifier for unlock in future
    unlock(id: string); // unlocks file for read operation
    writeLock(id: string): Promise<boolean>; // locks file for read, key is used as identifier for unlock in future
    writeUnlock(id: string); // unlocks file for read operation
    isLocked(): boolean; // returns bool variable, true if nobody locks current file
    removeSync(id: string); // removing file from file system, raise error if file is locked
    remove(id: string): Promise<boolean>;// async remove method 
}

export interface IWriteAcquireData {
    requestId: string;
    fileName: string;
}

export interface IWriteAcquireDataReq {
    requestId: string;
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
