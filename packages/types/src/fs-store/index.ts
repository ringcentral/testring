
export const enum FSFileType {
    BINARY = 0,
    TEXT = 1,
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
    fName: string; // absolute file path
    readSync(): Buffer; // reading file from disk and pass a return a buffer, raise error if file is removed
    read(): Promise<Buffer>; // the same part but with promise wrapper
    lock(id: string): boolean; // locks file for remove, key is used as identifier for unlock in future
    unlock(id: string); // unlocks file for remove operation
    isLocked(): boolean; // returns bool variable, true if nobody locks current file
    removeSync(); // removing file from file system, raise error if file is locked
    remove(): Promise<boolean>;// async remove method 
}

export interface IWriteAcquireData {
    requestId: string;
}
