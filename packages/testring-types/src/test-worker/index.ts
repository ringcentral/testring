import { IFile } from '../fs-reader';

export interface ITestWorkerInstance {
    execute(file: IFile, parameters: any, envParameters: any): Promise<any>;

    kill(): void;
}

export interface ITestWorker {
    spawn(): ITestWorkerInstance;
}
