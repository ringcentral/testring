
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
    pending = 'pending',
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

interface ITestExecutionError {
    message: string,
    stacktrace: string
}

export interface ITestExecutionCompleteMessage {
    status: TestStatus,
    error: ITestExecutionError | null
}

export interface ITestWorkerInstance {
    execute(rawSource: string, filename: string, parameters: object): Promise<any>
    kill(): void
}

export interface ITestWorker {
    spawn(): ITestWorkerInstance
}
