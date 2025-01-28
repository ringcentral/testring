import {IFile} from '../index';

export type DependencyFileReader = (filePath: string) => Promise<string>;

export interface IDependencyDictionary<T> {
    [key: string]: T;
}

export type IDependencyDictionaryNode = IFile;

export interface IDependencyTreeNode extends IDependencyDictionaryNode {
    nodes: IDependencyDictionary<IDependencyTreeNode> | null;
}

export type DependencyDict = IDependencyDictionary<
    IDependencyDictionary<IDependencyDictionaryNode>
>;
