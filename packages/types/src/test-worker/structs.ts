import { TestStatus } from './enums';
import { DependencyDict, IDependencyDictionaryNode } from '../dependencies-builder';

export type FileCompiler = (source: string, filename: string) => Promise<string>;

export interface ITestExecutionMessage extends IDependencyDictionaryNode {
    waitForRelease: boolean;
    dependencies: DependencyDict;
    // TODO move types here
    parameters: any;
    envParameters: any;
}

export interface ITestEvaluationMessage extends IDependencyDictionaryNode {}

export interface ITestExecutionCompleteMessage {
    status: TestStatus;
    error: Error | null;
}

export interface ITestControllerExecutionState {
    paused: boolean;
    pausedTilNext: boolean;
    pending: boolean;
}
