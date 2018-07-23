import { LogTypes, LogLevel, LogQueueStatus } from './enums';

export interface ILogEntry {
    time: Date;
    type: LogTypes;
    logLevel: LogLevel;
    content: Array<any>;
    formattedMessage: string;
    stepUid?: string;
    parentStep: string | null;
    logEnvironment?: any;
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
