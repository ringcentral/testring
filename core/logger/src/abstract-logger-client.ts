import {Stack, generateUniqId} from '@testring-dev/utils';
import {transport} from '@testring-dev/transport';
import {
    ILogEntity,
    ILoggerClient,
    ITransport,
    LoggerMessageTypes,
    LogLevel,
    LogStepTypes,
    LogTypes,
    LogEntityPrefixType,
    LogEntityMarkerType,
} from '@testring-dev/types';

type stepEntity = {
    stepID: string;
    message: string;
};
type LoggerStack = Stack<stepEntity>;
type AbstractLoggerType = ILoggerClient<
    ITransport,
    LogEntityPrefixType,
    LogEntityMarkerType,
    LoggerStack
>;

export abstract class AbstractLoggerClient implements AbstractLoggerType {
    constructor(
        protected transportInstance: ITransport = transport,
        protected prefix: LogEntityPrefixType = null,
        protected marker: LogEntityMarkerType = null,
        protected stepStack: LoggerStack = new Stack(),
    ) {}

    protected abstract broadcast(messageType: string, payload: any): void;

    protected getCurrentStep(): stepEntity | null {
        return this.stepStack.getLastElement();
    }

    protected getPreviousStep(): stepEntity | null {
        return this.stepStack.getLastElement(1);
    }

    protected generateStepEntity(message: string): stepEntity {
        return {
            stepID: generateUniqId(),
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
        const marker = this.marker;
        const prefix = this.prefix;

        const time = new Date();
        const isStepType = logType === LogTypes.step;
        const currentStep = this.getCurrentStep();
        const previousStep = this.getPreviousStep();

        const currentStepID = currentStep ? currentStep.stepID : null;
        const previousStepID = previousStep ? previousStep.stepID : null;

        const stepUid = isStepType && currentStepID ? currentStepID : null;
        const parentStep = isStepType ? previousStepID : currentStepID;
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
            marker,
        };
    }

    protected createLog(
        type: LogTypes,
        logLevel: LogLevel,
        content: Array<any>,
        stepType: LogStepTypes = LogStepTypes.log,
    ): ILogEntity {
        const logEntry = this.buildEntry(type, content, logLevel, stepType);

        this.broadcast(LoggerMessageTypes.REPORT, logEntry);

        return logEntry;
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

    public screenshot(filename: string, content: Buffer): void {
        this.createLog(LogTypes.screenshot, LogLevel.info, [filename, content]);
    }

    public file(filename: string, meta: Record<string, any> = {}): void {
        this.createLog(LogTypes.file, LogLevel.info, [filename, meta]);
    }

    public startStep(message: string, stepType?: LogStepTypes): void {
        const step = this.generateStepEntity(message);

        this.pushStackStep(step);

        this.createLog(LogTypes.step, LogLevel.info, [message], stepType);
    }

    public startStepLog(message: any): void {
        this.startStep(message, LogStepTypes.log);
    }

    public startStepInfo(message: any): void {
        this.startStep(message, LogStepTypes.info);
    }

    public startStepDebug(message: any): void {
        this.startStep(message, LogStepTypes.debug);
    }

    public startStepSuccess(message: any): void {
        this.startStep(message, LogStepTypes.success);
    }

    public startStepWarning(message: any): void {
        this.startStep(message, LogStepTypes.warning);
    }

    public startStepError(message: any): void {
        this.startStep(message, LogStepTypes.error);
    }

    public endStep(message?: any, ...messageToLog: Array<any>): void {
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

    public endAllSteps(): void {
        let step = this.popStackStep();

        while (step) {
            step = this.popStackStep();
        }
    }

    public async step(
        message: any,
        callback: () => any,
        stepType?: LogStepTypes,
    ): Promise<void> {
        this.startStep(message, stepType);

        let caughtError;

        try {
            await callback();
        } catch (err) {
            caughtError = err;
        }

        this.endStep(message);

        if (caughtError) {
            throw caughtError;
        }
    }

    public async stepLog(message: any, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.log);
    }

    public async stepInfo(message: any, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.info);
    }

    public async stepDebug(message: any, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.debug);
    }

    public async stepSuccess(message: any, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.success);
    }

    public async stepWarning(message: any, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.warning);
    }

    public async stepError(message: any, callback: () => any): Promise<void> {
        return this.step(message, callback, LogStepTypes.error);
    }

    public withPrefix(prefix: LogEntityPrefixType) {
        return this.createNewLogger(prefix, this.marker, this.stepStack);
    }

    public withMarker(marker: LogEntityMarkerType) {
        return this.createNewLogger(this.prefix, marker, this.stepStack);
    }

    public createNewLogger(
        prefix: LogEntityPrefixType = this.prefix,
        marker: LogEntityMarkerType = this.marker,
        stepStack: LoggerStack = this.stepStack,
    ) {
        return new (this.constructor as any)(
            this.transportInstance,
            prefix,
            marker,
            stepStack,
        ) as this;
    }
}
