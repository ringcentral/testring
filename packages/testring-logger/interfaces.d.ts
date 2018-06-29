import { LogTypes, LogLevel } from './src/structs';

export interface ILogEntry {
    time: Date,
    type: LogTypes,
    nestingLevel: number,
    logLevel: LogLevel,
    content: Array<any>,
    formattedMessage: string
}
