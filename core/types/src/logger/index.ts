import {LogTypes, LogLevel, LogQueueStatus, LogStepTypes} from './enums';

export type LogEntityStepUidType = string | null;

export type LogEntityPrefixType = string | null;

export type LogEntityMarkerType = string | number | null;

export interface ILogEntity {
    time: Date;
    type: LogTypes;
    logLevel: LogLevel;
    content: Array<any>;
    stepUid: LogEntityStepUidType;
    stepType: LogStepTypes | null;
    parentStep: LogEntityStepUidType;
    prefix: LogEntityPrefixType;
    marker: LogEntityMarkerType;

    muteStdout?: boolean;
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

export interface ILoggerClient<Transport, Prefix, Marker, Stack> {
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug(...args: any[]): void;
    verbose(...args: any[]): void;
    success(...args: any[]): void;

    startStep(message: any, stepType?: LogStepTypes): void;

    startStepLog(message: any): void;
    startStepInfo(message: any): void;
    startStepDebug(message: any): void;
    startStepSuccess(message: any): void;
    startStepWarning(message: any): void;
    startStepError(message: any): void;

    endStep(stepUid: string): void;
    endAllSteps(): void;

    step(
        message: string,
        callback: () => Promise<any> | any,
        stepType?: LogStepTypes,
    ): Promise<any>;

    stepLog(message: any, callback: () => Promise<any> | any): Promise<any>;
    stepInfo(message: any, callback: () => Promise<any> | any): Promise<any>;
    stepDebug(message: any, callback: () => Promise<any> | any): Promise<any>;
    stepSuccess(message: any, callback: () => Promise<any> | any): Promise<any>;
    stepWarning(message: any, callback: () => Promise<any> | any): Promise<any>;
    stepError(message: any, callback: () => Promise<any> | any): Promise<any>;

    withPrefix(prefix: Prefix): ILoggerClient<Transport, Prefix, Marker, Stack>;
    withMarker(marker: Marker): ILoggerClient<Transport, Prefix, Marker, Stack>;

    createNewLogger(
        prefix: Prefix,
        mark: Marker,
        stepStack: Stack,
    ): ILoggerClient<Transport, Prefix, Marker, Stack>;
}
