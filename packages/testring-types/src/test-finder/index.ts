export const enum TestsFinderPlugins {
    beforeResolve = 'beforeResolve',
    afterResolve = 'afterResolve'
}

export interface ITestFile {
    path: string;
    content: string;
    meta: object;
}

export interface ITestFinder {
    find(pattern: string): Promise<ITestFile[]>;
}
