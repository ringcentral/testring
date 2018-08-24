import { Stack } from '@testring/utils';
import { transport } from '@testring/transport';
import { ILogEntity, ILoggerClient, ITransport, LoggerMessageTypes, LogLevel, LogTypes } from '@testring/types';

const nanoid = require('nanoid');

const STEP_NAME_SEPARATOR = '| / || / || / |_';

const composeStepName = (message: string): string => {
    return `${message}${STEP_NAME_SEPARATOR}${nanoid()}`;
};

const decomposeStepName = (stepID: string): string => {
    return stepID.split(STEP_NAME_SEPARATOR)[0];
};

export abstract class AbstractLoggerClient implements ILoggerClient {
    constructor(
        protected transportInstance: ITransport = transport,
        protected prefix: string = '',
    ) {
    }

    protected abstract broadcast(messageType: string, payload: any): void;

    protected stepStack: Stack<string> = new Stack();

    protected logBatch: Array<ILogEntity> = [];

    protected getCurrentStep(): string | null {
        return this.stepStack.getLastElement();
    }

    protected getPreviousStep(): string | null {
        return this.stepStack.getLastElement(1);
    }

    protected buildEntry(
        logType: LogTypes,
        content: Array<any>,
        logLevel: LogLevel
    ): ILogEntity {
        const time = new Date();
        const currentStep = this.getCurrentStep();
        const previousStep = this.getPreviousStep();

        const stepUid = logType === LogTypes.step && currentStep
            ? currentStep
            : undefined;

        const parentStep = logType === LogTypes.step
            ? previousStep
            : currentStep;

        const prefix = this.prefix || undefined;

        return {
            time,
            type: logType,
            logLevel,
            content,
            stepUid,
            parentStep,
            prefix,
        };
    }

    protected createLog(
        type: LogTypes,
        logLevel: LogLevel,
        content: Array<any>
    ): void {
        const logEntry = this.buildEntry(type, content, logLevel);

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
        this.createLog(LogTypes.log, LogLevel.info, args);
    }

    public info(...args): void {
        this.createLog(LogTypes.info, LogLevel.info, args);
    }

    public warn(...args): void {
        this.createLog(LogTypes.warning, LogLevel.warning, args);
    }

    public error(...args): void {
        this.createLog(LogTypes.error, LogLevel.error, args);
    }

    public debug(...args): void {
        this.createLog(LogTypes.debug, LogLevel.debug, args);
    }

    public verbose(...args): void {
        this.createLog(LogTypes.debug, LogLevel.verbose, args);
    }

    public media(filename: string, content: Buffer): void {
        this.createLog(LogTypes.media, LogLevel.info, [filename, content]);
    }

    public startStep(key: string): void {
        const step = composeStepName(key);

        this.stepStack.push(step);

        this.createLog(
            LogTypes.step,
            LogLevel.info,
            [key]
        );
    }

    public endStep(key?: string, ...messageToLog: Array<any>): void {
        if (messageToLog.length) {
            this.info('[step end]', ...messageToLog);
        }

        let stepID = this.stepStack.pop();

        if (key) {
            while (stepID) {
                const stepMessage = decomposeStepName(stepID);

                if (key === stepMessage) {
                    break;
                } else {
                    stepID = this.stepStack.pop();
                }
            }
        }

        if (stepID && this.stepStack.length === 0) {
            this.sendBatchedLog();
        }
    }

    public async step(message: string, callback: () => any): Promise<void> {
        this.startStep(message);

        const result = callback();

        if (result && result.then && typeof result.then === 'function') {
            await result;
        }

        this.endStep(message);
    }
}
