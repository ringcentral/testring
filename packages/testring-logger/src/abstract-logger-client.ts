import * as util from 'util';
import { merge } from 'lodash';
import { transport } from '@testring/transport';
import { Stack } from '@testring/utils';
import { ITransport, ILogEntry, ILoggerClient, LoggerMessageTypes, LogTypes, LogLevel } from '@testring/types';

const nanoid = require('nanoid');

const formatLog = (logType: LogTypes, logLevel: LogLevel, time: Date, content: Array<any>): string => {
    if (logType === LogTypes.media) {
        return util.format(
            `[${logLevel}] [${time.toLocaleTimeString()}] [media]`,
            content[0],
            `${content[1].length} bytes`
        );
    }

    return util.format(
        `[${logLevel}] [${time.toLocaleTimeString()}]`, ...content
    );
};

export abstract class AbstractLoggerClient implements ILoggerClient {
    constructor(
        protected transportInstance: ITransport = transport,
        protected logLevel: LogLevel = LogLevel.info,
        protected logEnvironment?: any
    ) {
    }

    protected abstract broadcast(messageType: string, payload: any): void;

    protected stepStack: Stack<string> = new Stack();

    protected logBatch: Array<ILogEntry> = [];

    protected getCurrentStep(): string | null {
        return this.stepStack.getLastElement();
    }

    protected getPreviousStep(): string | null {
        return this.stepStack.getLastElement(1);
    }

    protected buildEntry(
        logType: LogTypes,
        content: Array<any>,
        logLevel: LogLevel = this.logLevel,
        logEnvironment: any = this.logEnvironment
    ): ILogEntry {
        const time = new Date();
        const formattedMessage = formatLog(logType, logLevel, time, content);
        const currentStep = this.getCurrentStep();
        const previousStep = this.getPreviousStep();

        const stepUid = logType === LogTypes.step && currentStep
            ? currentStep
            : undefined;

        const parentStep = logType === LogTypes.step
            ? previousStep
            : currentStep;

        return {
            time,
            type: logType,
            logLevel,
            content,
            formattedMessage,
            stepUid,
            parentStep,
            logEnvironment
        };
    }

    protected createLog(
        type: LogTypes,
        content: Array<any>,
        logLevel: LogLevel = this.logLevel,
        logEnvironment: any = this.logEnvironment
    ): void {
        const logEntry = this.buildEntry(type, content, logLevel, logEnvironment);

        if (this.getCurrentStep()) {
            this.logBatch.push(logEntry);
        } else {
            this.broadcast(
                LoggerMessageTypes.REPORT,
                logEntry
            );
        }
    }

    protected sendBatchedLog(): void {
        this.broadcast(
            LoggerMessageTypes.REPORT_BATCH,
            this.logBatch
        );

        this.logBatch = [];
    }

    public log(...args): void {
        this.createLog(LogTypes.log, args, LogLevel.info);
    }

    public info(...args): void {
        this.createLog(LogTypes.info, args, LogLevel.info);
    }

    public warn(...args): void {
        this.createLog(LogTypes.warning, args, LogLevel.warning);
    }

    public error(...args): void {
        this.createLog(LogTypes.error, args, LogLevel.error);
    }

    public debug(...args): void {
        this.createLog(LogTypes.debug, args, LogLevel.debug);
    }

    public media(filename: string, content: Buffer): void {
        this.createLog(LogTypes.media, [filename, content], LogLevel.info);
    }

    public withLogEnvironment(logEnvironment: any) {
        return {
            log: (...args) => this.createLog(LogTypes.log, args, LogLevel.info, logEnvironment),
            info: (...args) => this.createLog(LogTypes.info, args, LogLevel.info, logEnvironment),
            warn: (...args) => this.createLog(LogTypes.warning, args, LogLevel.warning, logEnvironment),
            error: (...args) => this.createLog(LogTypes.error, args, LogLevel.error, logEnvironment),
            debug: (...args) => this.createLog(LogTypes.debug, args, LogLevel.debug, logEnvironment),
            media: (...args) => this.createLog(LogTypes.media, args, LogLevel.info, logEnvironment)
        };
    }

    public startStep(message: string): void {
        const step = nanoid();

        this.stepStack.push(step);

        this.createLog(
            LogTypes.step,
            [message]
        );
    }

    public endStep(): void {
        const pop = this.stepStack.pop();

        if (pop && this.stepStack.length <= 0) {
            this.sendBatchedLog();
        }
    }

    public async step(message: string, callback: () => any): Promise<void> {
        this.startStep(message);

        const result = callback();

        if (result && result.then && typeof result.then === 'function') {
            await result;
        }

        this.endStep();
    }

    public setLogEnvironment(logEnvironment: object): void {
        this.logEnvironment = merge(this.logEnvironment, logEnvironment);
    }
}
