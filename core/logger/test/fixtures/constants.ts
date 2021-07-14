import {
    ILogEntity,
    LogLevel,
    LogStepTypes,
    LogTypes,
} from '@testring/types';

export const report = ['foo', ['bar'], { baz: 'baz' }];

export const LOG_ENTITY: ILogEntity = {
    type: LogTypes.log,
    time: new Date(),
    logLevel: LogLevel.verbose,
    content: ['foo', 'bar'],
    parentStep: null,
    stepUid: null,
    prefix: null,
    stepType: null,
    marker: null,
};

export const stepsTypes: Array<Partial<ILogEntity>> = [
    {
        type: LogTypes.step,
        logLevel: LogLevel.info,
        stepType: LogStepTypes.log,
    },
    {
        type: LogTypes.step,
        logLevel: LogLevel.info,
        stepType: LogStepTypes.info,
    },
    {
        type: LogTypes.step,
        logLevel: LogLevel.info,
        stepType: LogStepTypes.debug,
    },
    {
        type: LogTypes.step,
        logLevel: LogLevel.info,
        stepType: LogStepTypes.success,
    },
    {
        type: LogTypes.step,
        logLevel: LogLevel.info,
        stepType: LogStepTypes.warning,
    },
    {
        type: LogTypes.step,
        logLevel: LogLevel.info,
        stepType: LogStepTypes.error,
    },
    {
        type: LogTypes.log,
        logLevel: LogLevel.info,
        stepType: null,
    },
];
