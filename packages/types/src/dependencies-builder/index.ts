export type DependencyFileReaderResult = { source: string; transpiledSource: string };

export type DependencyFileReader = (filePath: string) =>
    DependencyFileReaderResult | Promise<DependencyFileReaderResult>;

export interface IDependencyDictionary<T> {
    [key: string]: T;
}

export interface IDependencyDictionaryNode extends DependencyFileReaderResult{
    dependencies: { [key: string]: string };
}

export type DependencyDict = IDependencyDictionary<IDependencyDictionaryNode>;
