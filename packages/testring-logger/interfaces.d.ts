import { LogTypes } from './src/structs';

export interface ILogEntry {
    time: Date,
    type: LogTypes,
    logLevel: number,
    content: string[],
    formattedMessage: string,
    stepUid?: string,
    parentStep: string | null,
    logEnvironment?: any,
}
