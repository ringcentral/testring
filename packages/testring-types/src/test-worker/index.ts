
export type TestCompiler = (source: string, filename: string) => Promise<string>;

export const enum TestWorkerPlugin {
    compile = 'compile'
}

export const enum TestEvents {
    started = 'test/started',
    finished = 'test/finished',
    failed = 'test/failed'
}

export const enum TestStatus {
    idle = 'idle',
    done = 'done',
    failed = 'failed'
}

export const enum TestWorkerAction {
    executeTest = 'executeTest',
    executionComplete = 'executionComplete'
}

export interface ITestExecutionMessage {
    source: string,
    filename: string,
    parameters: object
}

export interface ITestExecutionCompleteMessage {
    status: TestStatus,
    error: Error | null
}

export interface ITestExecutionError {
    test: string,
    error: Error
}

export interface ITestWorkerInstance {
    execute(rawSource: string, filename: string, parameters: object): Promise<any>
    kill(): void
}

export interface ITestWorker {
    spawn(): ITestWorkerInstance
}
