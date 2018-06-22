import { ISerializedStruct } from '../../interfaces';

export interface ISerializedError extends ISerializedStruct {
    $key: string,
    type: string,
    message: string,
    stack: string | void
}

export const ERROR_KEY = 'Error';

export const serializeError = (error: Error | EvalError): ISerializedError => {
    return {
        $key: ERROR_KEY,
        type: error.name,
        message: error.message,
        stack: error.stack
    };
};

export const deserializeError = (serializedError: ISerializedError): Error => {
    let Contructor;

    switch (serializedError.type) {
        case 'EvalError':
            Contructor = EvalError;
            break;

        case 'RangeError':
            Contructor = RangeError;
            break;

        case 'ReferenceError':
            Contructor = ReferenceError;
            break;

        case 'SyntaxError':
            Contructor = SyntaxError;
            break;

        case 'TypeError':
            Contructor = TypeError;
            break;

        case 'URIError':
            Contructor = URIError;
            break;

        default:
            Contructor = Error;
    }

    const error = new Contructor(serializedError.message);

    error.stack = serializedError.stack;

    return error;
};
