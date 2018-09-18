import { IFile } from '../fs-reader';
import { ScreenshotsConfig } from '../config';

export interface ITestWorkerInstance {
    getWorkerID(): string;

    execute(file: IFile, parameters: any, envParameters: any): Promise<any>;

    kill(): void;
}

export interface ITestWorkerCallbackMeta {
    processID: string;
}

export interface ITestWorkerConfig {
    screenshots: ScreenshotsConfig;
    debug: boolean;
}

export interface ITestWorker {
    spawn(): ITestWorkerInstance;
}
