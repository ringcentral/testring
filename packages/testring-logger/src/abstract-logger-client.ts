import * as util from 'util';
import { ITransport } from '@testring/types';
import { transport } from '@testring/transport';
import { ILogEntry } from '../interfaces';
import { LoggerMessageTypes, LogTypes, LogLevel } from './structs';

const nanoid = require('nanoid');

const formatLog = (time: Date, content: Array<any>): string => {
    return util.format(
        `[${time.toLocaleTimeString()}]`, ...content
    );
};

export abstract class AbstractLoggerClient {
    constructor(
        protected transportInstance: ITransport = transport,
        protected logLevel: number = LogLevel.info
    ) {
    }

    protected abstract broadcast(messageType: string, payload: any): void;

    protected stepStack: Array<string> = [];

    protected logBatch: Array<ILogEntry> = [];

    protected get currentStep() {
        return this.stepStack[this.stepStack.length - 1] || null;
    }

    protected get previousStep() {
        return this.stepStack[this.stepStack.length - 2] || null;
    }

    protected buildEntry(
        type: LogTypes,
        content: Array<any>,
        logLevel: number = this.logLevel
    ): ILogEntry {
        const time = new Date();
        const formattedMessage = formatLog(time, content);

        const stepUid = type === LogTypes.step && this.currentStep
            ? this.currentStep
            : undefined;

        const parentStep = type === LogTypes.step
            ? this.previousStep
            : this.currentStep;

        return {
            time,
            type,
            logLevel,
            content,
            formattedMessage,
            stepUid,
            parentStep,
        };
    }

    protected createLog(
        type: LogTypes,
        content: Array<any>,
        logLevel: number = this.logLevel
    ): void {
        const logEntry = this.buildEntry(type, content, logLevel);

        if (this.currentStep) {
            this.logBatch.push(logEntry);
        } else {
            this.broadcast(
                LoggerMessageTypes.REPORT,
                logEntry,
            );
        }
    }

    protected sendLogBatch(): void {
        this.broadcast(
            LoggerMessageTypes.REPORT_BATCH,
            this.logBatch,
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

    public startStep(message: string): void {
        const step = nanoid();

        this.stepStack.push(step);

        this.createLog(
            LogTypes.step,
            [ message ],
        );
    }

    public endStep(): void {
        this.stepStack.pop();

        if (this.stepStack.length <= 0) {
            this.sendLogBatch();
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
}
