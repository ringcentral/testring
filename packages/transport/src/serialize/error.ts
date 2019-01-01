import { ITransportSerializedStruct } from '@testring/types';

export interface ISerializedError extends ITransportSerializedStruct {
    $key: string;
    type: string;
    message: string;
    stack: string | void;
}

export const ERROR_KEY = 'Error';

export function serializeError(error: Error | EvalError): ISerializedError {
    return {
        $key: ERROR_KEY,
        type: error.name,
        message: error.message,
        stack: error.stack,
    };
}

export function deserializeError(serializedError: ISerializedError): Error {
    let Constructor;

    switch (serializedError.type) {
        case 'EvalError':
            Constructor = EvalError;
            break;

        case 'RangeError':
            Constructor = RangeError;
            break;

        case 'ReferenceError':
            Constructor = ReferenceError;
            break;

        case 'SyntaxError':
            Constructor = SyntaxError;
            break;

        case 'TypeError':
            Constructor = TypeError;
            break;

        case 'URIError':
            Constructor = URIError;
            break;

        default:
            Constructor = Error;
    }

    const error = new Constructor(serializedError.message);

    error.stack = serializedError.stack;

    return error;
}
