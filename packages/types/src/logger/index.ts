import {
    LogTypes,
    LogLevel,
    LogQueueStatus
} from './enums';

export interface ILogEntity {
    time: Date;
    type: LogTypes;
    logLevel: LogLevel;
    content: Array<any>;
    stepUid: string | null;
    parentStep: string | null;
    prefix: string | null;
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

export interface ILoggerClient<Transport, Prefix, Stack> {
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

    getLogger(prefix?: Prefix, stepStack?: Stack): ILoggerClient<Transport, Prefix, Stack>;
}
