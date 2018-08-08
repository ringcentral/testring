import { IFile } from '../fs-reader';
import { TestStatus } from './enums';

export type FileCompiler = (source: string, filename: string) => Promise<string>;

export interface ITestExecutionMessage extends IFile {
    // TODO move types here
    dependencies: any;
    parameters: any;
    envParameters: any;
}

export interface ITestExecutionCompleteMessage {
    status: TestStatus;
    error: Error | null;
}
