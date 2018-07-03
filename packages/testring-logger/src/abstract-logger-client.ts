import * as util from 'util';
import { transport } from '@testring/transport';
import { ITransport, ILogEntry, ILoggerClient, LoggerMessageTypes, LogTypes, LogLevel } from '@testring/types';

const nanoid = require('nanoid');

const formatLog = (logLevel: LogLevel, time: Date, content: Array<any>): string => {
    return util.format(
        `[${logLevel}] [${time.toLocaleTimeString()}]`, ...content
    );
};

export abstract class AbstractLoggerClient implements ILoggerClient {
    constructor(
        protected transportInstance: ITransport = transport,
        protected logNesting: number = 0,
        protected logLevel: LogLevel = LogLevel.info
    ) {
    }

    protected abstract broadcast(messageType: string, payload: any): void;

    protected stepStack: Array<string> = [];

    protected logBatch: Array<ILogEntry> = [];

    protected getCurrentStep(): string | null {
        return this.stepStack[this.stepStack.length - 1] || null;
    }

    protected getPreviousStep(): string | null {
        return this.stepStack[this.stepStack.length - 2] || null;
    }

    protected buildEntry(
        type: LogTypes,
        content: Array<any>,
        logLevel: LogLevel = this.logLevel
    ): ILogEntry {
        const time = new Date();
        const formattedMessage = formatLog(logLevel, time, content);
        const currentStep = this.getCurrentStep();
        const previousStep = this.getPreviousStep();

        const stepUid = type === LogTypes.step && currentStep
            ? currentStep
            : undefined;

        const parentStep = type === LogTypes.step
            ? previousStep
            : currentStep;

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
        logLevel: LogLevel = this.logLevel
    ): void {
        const logEntry = this.buildEntry(type, content, logLevel);

        if (this.getCurrentStep()) {
            this.logBatch.push(logEntry);
        } else {
            this.broadcast(
                LoggerMessageTypes.REPORT,
                logEntry,
            );
        }
    }

    protected sendBatchedLog(): void {
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
}
