import {
    LogTypes,
    LogLevel,
    LogQueueStatus,
    LogStepTypes,
} from './enums';

export interface ILogEntity {
    time: Date;
    type: LogTypes;
    logLevel: LogLevel;
    content: Array<any>;
    stepUid: string | null;
    stepType: LogStepTypes | null;
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

    startStep(message: string, stepType?: LogStepTypes): void;

    startStepLog(message: string): void;
    startStepInfo(message: string): void;
    startStepDebug(message: string): void;
    startStepSuccess(message: string): void;
    startStepWarning(message: string): void;
    startStepError(message: string): void;

    endStep(): void;

    step(message: string, callback: () => Promise<any> | any, stepType?: LogStepTypes): Promise<any>;

    stepLog(message: string, callback: () => Promise<any> | any): Promise<any>;
    stepInfo(message: string, callback: () => Promise<any> | any): Promise<any>;
    stepDebug(message: string, callback: () => Promise<any> | any): Promise<any>;
    stepSuccess(message: string, callback: () => Promise<any> | any): Promise<any>;
    stepWarning(message: string, callback: () => Promise<any> | any): Promise<any>;
    stepError(message: string, callback: () => Promise<any> | any): Promise<any>;

    getLogger(prefix?: Prefix, stepStack?: Stack): ILoggerClient<Transport, Prefix, Stack>;
}
