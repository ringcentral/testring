import { IFile } from '../fs-reader';
import { ScreenshotsConfig } from '../config';

export interface ITestWorkerInstance {
    getWorkerID(): string;

    execute(file: IFile, parameters: any, envParameters: any, httpThrottle: number): Promise<any>;

    kill(signal?: NodeJS.Signals): Promise<void>;
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
