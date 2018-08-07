import { IFile } from '../index';

export type DependencyFileReader = (filePath: string) => Promise<string>;

export interface IDependencyDictionary<T> {
    [key: string]: T;
}

export interface IDependencyDictionaryNode extends IFile {}

export interface IDependencyTreeNode extends IDependencyDictionaryNode {
    nodes: IDependencyDictionary<IDependencyTreeNode> | null;
}
