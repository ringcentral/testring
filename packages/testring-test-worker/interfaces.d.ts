import { TestStatus } from './src/constants';

export interface IExecutionMessage {
    source: string,
    filename: string,
    parameters: object
}

interface IExecutionError {
    message: string,
    stacktrace: string
}

export interface IExecutionCompleteMessage {
    status: TestStatus,
    error: IExecutionError | null
}
