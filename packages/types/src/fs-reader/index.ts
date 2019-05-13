export const enum FSReaderPlugins {
    beforeResolve = 'beforeResolve',
    afterResolve = 'afterResolve'
}

export interface IFile {
    path: string;
    source: string;
}

export interface IFSReader {
    find(pattern: string): Promise<IFile[]>;
}
