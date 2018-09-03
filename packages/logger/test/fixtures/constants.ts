import { LogTypes, LogLevel, ILogEntity } from '@testring/types';

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
};
