import * as util from 'util';
import { Transport, transport } from '@testring/transport';
import { ILogEntry } from '../interfaces';
import { LoggerMessageTypes, LogTypes } from './structs';

export abstract class AbstractLoggerClient {
    constructor(
        protected transportInstance: Transport = transport,
        protected logLevel: number = 0,
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
        level: number = this.logLevel,
    ): ILogEntry {
        const time = new Date();
        const formattedMessage = this.formatLog(time, content);

        return {
            time,
            type,
            level,
            content,
            formattedMessage
        };
    }

    protected createLog(type: LogTypes, content: Array<any>, level: number = this.logLevel): void {
        this.broadcast(
            LoggerMessageTypes.REPORT,
            this.buildEntry(type, content, level),
        );
    }

    public setLevel(level: number): void {
        this.logLevel = level;
    }

    public log(...args): void {
        this.createLog(LogTypes.log, args, this.logLevel);
    }

    public info(...args): void {
        this.createLog(LogTypes.info, args, this.logLevel);
    }

    public warn(...args): void {
        this.createLog(LogTypes.warning, args, this.logLevel);
    }

    public error(...args): void {
        this.createLog(LogTypes.error, args, this.logLevel);
    }

    public debug(...args): void {
        this.createLog(LogTypes.debug, args, this.logLevel);
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
