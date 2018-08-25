import { LogTypes, LogLevel, LogQueueStatus } from './enums';

export interface ILogEntity {
    time: Date;
    type: LogTypes;
    logLevel: LogLevel;
    content: Array<any>;
    stepUid?: string;
    parentStep: string | null;
    prefix?: string;
}

export interface ILogMeta {
    processID?: string;
}

export interface ILogQueue {
    logEntity: ILogEntity;
    meta: ILogMeta;
}

export interface ILoggerServer {
    getQueueStatus(): LogQueueStatus;
}

export interface ILoggerClient {
    log(...args): void;

    info(...args): void;

    warn(...args): void;

    error(...args): void;

    debug(...args): void;

    verbose(...args): void;

    success(...args): void;

    step(message: string, callback: () => Promise<any> | any): Promise<any>;

    startStep(message: string): void;

    endStep(): void;
}
