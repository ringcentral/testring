import { LogTypes } from './src/structs';

export interface ILogEntry {
    time: Date,
    type: LogTypes,
    nestingLevel: number,
    logLevel: number,
    content: string[],
    formattedMessage: string
}
