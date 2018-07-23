export interface ITestWorkerInstance {
    execute(rawSource: string, filename: string, parameters: any, envParameters: any): Promise<any>;

    kill(): void;
}

export interface ITestWorker {
    spawn(): ITestWorkerInstance;
}
