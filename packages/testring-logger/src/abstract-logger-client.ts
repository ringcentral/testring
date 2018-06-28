import * as util from 'util';
import { ITransport } from '@testring/types';
import { transport } from '@testring/transport';
import { ILogEntry } from '../interfaces';
import { LoggerMessageTypes, LogTypes, LogLevel } from './structs';

export abstract class AbstractLoggerClient {
    constructor(
        protected transportInstance: ITransport = transport,
        protected logNesting: number = 0,
        protected logLevel: number = LogLevel.info
    ) {
    }

    private formatLog(time: Date, content: Array<any>): string {
        return util.format(
            `[${time.toLocaleTimeString()}]`, ...content
        );
    }

    protected abstract broadcast(messageType: string, payload: any): void;

    protected buildEntry(
        type: LogTypes,
        content: Array<any>,
        nestingLevel: number = this.logNesting,
        logLevel: number = this.logLevel
    ): ILogEntry {
        const time = new Date();
        const formattedMessage = this.formatLog(time, content);

        return {
            time,
            type,
            nestingLevel,
            logLevel,
            content,
            formattedMessage
        };
    }

    protected createLog(type: LogTypes,
                        content: Array<any>,
                        nestingLevel: number = this.logNesting,
                        logLevel: number = this.logLevel
    ): void {
        this.broadcast(
            LoggerMessageTypes.REPORT,
            this.buildEntry(type, content, nestingLevel, logLevel),
        );
    }

    public setLogNestingLevel(level: number): void {
        this.logNesting = level;
    }

    public log(...args): void {
        this.createLog(LogTypes.log, args, this.logNesting, LogLevel.info);
    }

    public info(...args): void {
        this.createLog(LogTypes.info, args, this.logNesting, LogLevel.info);
    }

    public warn(...args): void {
        this.createLog(LogTypes.warning, args, this.logNesting, LogLevel.warning);
    }

    public error(...args): void {
        this.createLog(LogTypes.error, args, this.logNesting, LogLevel.error);
    }

    public debug(...args): void {
        this.createLog(LogTypes.debug, args, this.logNesting, LogLevel.debug);
    }

    public withLevel(level: number) {
        return {
            log: (...args) => this.createLog(LogTypes.log, args, level),
            info: (...args) => this.createLog(LogTypes.info, args, level),
            warn: (...args) => this.createLog(LogTypes.warning, args, level),
            error: (...args) => this.createLog(LogTypes.error, args, level),
            debug: (...args) => this.createLog(LogTypes.debug, args, level),
        };
    }
}
