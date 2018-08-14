import { IFile } from '../fs-reader';

export interface ITestWorkerInstance {
    getWorkerID(): string;

    execute(file: IFile, parameters: any, envParameters: any): Promise<any>;

    kill(): void;
}

export interface ITestWorkerCallbackMeta {
    processID: string;
}

export interface ITestWorker {
    spawn(): ITestWorkerInstance;
}
