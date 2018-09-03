import { Stack } from '@testring/utils';
import { transport } from '@testring/transport';
import {
    ILogEntity,
    ILoggerClient,
    ITransport,
    LoggerMessageTypes,
    LogLevel,
    LogStepTypes,
    LogTypes,
} from '@testring/types';

const nanoid = require('nanoid');


type stepEntity = {
    stepID: string;
    message: string;
};
type LoggerStack = Stack<stepEntity>;
type AbstractLoggerType = ILoggerClient<ITransport, string | null, LoggerStack>;

export abstract class AbstractLoggerClient implements AbstractLoggerType {
    constructor(
        protected transportInstance: ITransport = transport,
        protected prefix: string | null = null,
        protected stepStack: LoggerStack = new Stack(),
    ) {
    }

    protected abstract broadcast(messageType: string, payload: any): void;

    protected getCurrentStep(): stepEntity | null {
        return this.stepStack.getLastElement();
    }

    protected getPreviousStep(): stepEntity | null {
        return this.stepStack.getLastElement(1);
    }

    protected generateStepEntity(message: string): stepEntity {
        return {
            stepID: nanoid(),
            message,
        };
    }

    protected pushStackStep(step: stepEntity): void {
        this.stepStack.push(step);
    }

    protected popStackStep(): stepEntity | null {
        const step = this.stepStack.pop();

        if (step) {
            return step;
        }

        return null;
    }

    protected buildEntry(
        logType: LogTypes,
        content: Array<any>,
        logLevel: LogLevel,
        stepGroupType: LogStepTypes,
    ): ILogEntity {
        const time = new Date();
        const isStepType = logType === LogTypes.step;
        const currentStep = this.getCurrentStep();
        const previousStep = this.getPreviousStep();

        const currentStepID = currentStep ? currentStep.stepID : null;
        const previousStepID = previousStep ? previousStep.stepID : null;

        const stepUid = isStepType && currentStepID ? currentStepID : null;
        const parentStep = isStepType  ? previousStepID : currentStepID;
        const prefix = this.prefix || null;
        const stepType = isStepType ? stepGroupType : null;

        return {
            time,
            type: logType,
            logLevel,
            content,
            stepUid,
            stepType,
            parentStep,
            prefix,
        };
    }

    protected createLog(
        type: LogTypes,
        logLevel: LogLevel,
        content: Array<any>,
        stepType: LogStepTypes = LogStepTypes.log,
    ): void {
        const logEntry = this.buildEntry(type, content, logLevel, stepType);

        this.broadcast(
            LoggerMessageTypes.REPORT,
            logEntry
        );
    }

    public log(...args): void {
        this.createLog(LogTypes.log, LogLevel.info, args);
    }

    public info(...args): void {
        this.createLog(LogTypes.info, LogLevel.info, args);
    }

    public success(...args): void {
        this.createLog(LogTypes.success, LogLevel.info, args);
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

    public startStep(message: string, stepType?: LogStepTypes): void {
        const step = this.generateStepEntity(message);

        this.pushStackStep(step);

        this.createLog(
            LogTypes.step,
            LogLevel.info,
            [message],
            stepType,
        );
    }

    public startStepLog(message: string): void {
        this.startStep(message, LogStepTypes.log);
    }

    public startStepInfo(message: string): void {
        this.startStep(message, LogStepTypes.info);
    }

    public startStepDebug(message: string): void {
        this.startStep(message, LogStepTypes.debug);
    }

    public startStepSuccess(message: string): void {
        this.startStep(message, LogStepTypes.success);
    }

    public startStepWarning(message: string): void {
        this.startStep(message, LogStepTypes.warning);
    }

    public startStepError(message: string): void {
        this.startStep(message, LogStepTypes.error);
    }

    public endStep(message?: string, ...messageToLog: Array<any>): void {
        if (messageToLog.length) {
            this.info('[step end]', ...messageToLog);
        }

        let step = this.popStackStep();

        if (step) {
            while (step) {
                const stepMessage = step.message;

                if (message === stepMessage) {
                    break;
                } else {
                    step = this.popStackStep();
                }
            }
        }
    }

    public async step(message: string, callback: () => any, stepType?: LogStepTypes): Promise<void> {
        this.startStep(message, stepType);

        let caughtError;
        const result = callback();

        try {
            if (result && result.then && typeof result.then === 'function') {
                await result;
            }
        } catch (err) {
            caughtError = err;
        }

        this.endStep(message);
        if (caughtError) {
            throw caughtError;
        }
    }

    public async stepLog(message: string, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.log);
    }

    public async stepInfo(message: string, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.info);
    }

    public async stepDebug(message: string, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.debug);
    }

    public async stepSuccess(message: string, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.success);
    }

    public async stepWarning(message: string, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.warning);
    }

    public async stepError(message: string, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.error);
    }

    public getLogger(prefix: string | null = this.prefix, stepStack: LoggerStack = this.stepStack) {
        return new (this.constructor as any)(this.transportInstance, prefix, stepStack) as this;
    }
}
