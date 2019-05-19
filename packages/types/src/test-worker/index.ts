import { IFile } from '../fs-reader';
import { ScreenshotsConfig } from '../config';

export interface ITestWorkerInstance {
    getWorkerID(): string;

    execute(file: IFile, parameters: any, envParameters: any): Promise<any>;

    kill(signal?: NodeJS.Signals): Promise<void>;
}

export interface ITestWorkerCallbackMeta {
    processID: string;
    isLocal: boolean;
}

export interface ITestWorkerConfig {
    screenshots: ScreenshotsConfig;
    devtoolEnabled: boolean;
    localWorker: boolean;
}

export interface ITestWorker {
    spawn(): ITestWorkerInstance;
}
