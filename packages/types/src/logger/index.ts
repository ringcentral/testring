import { LogTypes, LogLevel, LogQueueStatus } from './enums';

export interface ILogEntity {
    time: Date;
    type: LogTypes;
    logLevel: LogLevel;
    content: Array<any>;
    stepUid?: string;
    parentStep: string | null;
    logEnvironment?: any;
}

export interface ILogQueue {
    logEntity: ILogEntity;
    processId?: string;
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

    step(message: string, callback: () => Promise<any> | any): Promise<any>;

    startStep(message: string): void;

    endStep(): void;
}
