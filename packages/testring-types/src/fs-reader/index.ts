export const enum FSReaderPlugins {
    beforeResolve = 'beforeResolve',
    afterResolve = 'afterResolve'
}

export interface IFile {
    path: string;
    content: string;
}

export interface IFSReader {
    find(pattern: string): Promise<IFile[]>;
}
