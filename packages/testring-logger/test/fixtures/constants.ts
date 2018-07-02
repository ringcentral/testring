import { LogTypes } from '@testring/types';

export const report = ['foo', ['bar'], { baz: 'baz' }];

export const entry = {
    type: LogTypes.log,
    logLevel: 1,
    message: ['foo', 'bar'],
    formattedMessage: 'hello'
};
