import {IFile} from '../fs-reader';
import {TestStatus} from './enums';

export type FileCompiler = (
    source: string,
    filename: string,
) => Promise<string>;

export interface ITestExecutionMessage extends IFile {
    waitForRelease: boolean;
    // TODO (flops) rename envParameters and fix any
    parameters: any;
    envParameters: any;
    workerId: string;
}

export type ITestEvaluationMessage = IFile;

export interface ITestExecutionCompleteMessage {
    status: TestStatus;
    error: Error | null;
    workerId: string;
}

export interface ITestControllerExecutionState {
    paused: boolean;
    pausedTilNext: boolean;
    pending: boolean;
}
