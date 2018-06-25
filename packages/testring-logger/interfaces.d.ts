import { LogTypes } from './src/structs';

export interface ILogEntry {
    time: Date,
    type: LogTypes,
    level: number,
    logLevel: number,
    content: string[],
    formattedMessage: string
}
