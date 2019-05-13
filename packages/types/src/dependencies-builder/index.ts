import { IFile } from '../index';

export type DependencyFileReaderResult = { source: string; transpiledSource: string };

export type DependencyFileReader = (filePath: string) =>
    DependencyFileReaderResult | Promise<DependencyFileReaderResult>;

export interface IDependencyDictionary<T> {
    [key: string]: T;
}

export interface IDependencyDictionaryNode extends IFile {
    transpiledSource: string;
}

export interface IDependencyTreeNode extends IDependencyDictionaryNode {
    nodes: IDependencyDictionary<IDependencyTreeNode> | null;
}

export type DependencyDict = IDependencyDictionary<IDependencyDictionary<IDependencyDictionaryNode>>;
