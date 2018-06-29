import { LogTypes, LogLevel } from './src/structs';

export interface ILogEntry {
    time: Date,
    type: LogTypes,
    logLevel: LogLevel,
    content: Array<any>,
    formattedMessage: string,
    stepUid?: string,
    parentStep: string | null,
}
