import {IFile} from '../fs-reader';
import {TestStatus} from './enums';
import {DependencyDict} from '../dependencies-builder';

export type FileCompiler = (
    source: string,
    filename: string,
) => Promise<string>;

export interface ITestExecutionMessage extends IFile {
    waitForRelease: boolean;
    dependencies: DependencyDict;
    // TODO (flops) rename envParameters and fix any
    parameters: any;
    envParameters: any;
}

export type ITestEvaluationMessage = IFile;

export interface ITestExecutionCompleteMessage {
    status: TestStatus;
    error: Error | null;
}

export interface ITestControllerExecutionState {
    paused: boolean;
    pausedTilNext: boolean;
    pending: boolean;
}
