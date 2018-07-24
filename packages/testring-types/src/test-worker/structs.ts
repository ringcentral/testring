import { TestStatus } from './enums';

export type FileCompiler = (source: string, filename: string) => Promise<string>;

export interface ITestExecutionMessage {
    source: string;
    filename: string;
    parameters: any;
    envParameters: any;
}

export interface ITestExecutionCompleteMessage {
    status: TestStatus;
    error: Error | null;
}
