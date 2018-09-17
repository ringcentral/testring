import { IFile } from '../fs-reader';

export interface ITestWorkerInstance {
    getWorkerID(): string;

    execute(file: IFile, parameters: any, envParameters: any): Promise<any>;

    kill(signal?: NodeJS.Signals): void;
}

export interface ITestWorkerCallbackMeta {
    processID: string;
}

export interface ITestWorkerConfig {
    debug: boolean;
}

export interface ITestWorker {
    spawn(): ITestWorkerInstance;
}
