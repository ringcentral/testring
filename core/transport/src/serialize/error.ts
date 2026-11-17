import {
    ITransportSerializedStruct,
    TransportDeserializer,
    TransportSerializer,
} from '@testring/types';

export interface ISerializedError extends ITransportSerializedStruct {
    $key: string;
    name: string;
    message: string;
    stack: string | void;
    cause?: ITransportSerializedStruct;
    dictionary: Record<string, ITransportSerializedStruct>;
}

export const ERROR_KEY = 'Error';

export function serializeError(
    error: Error,
    serialize: TransportSerializer,
): ISerializedError {
    if (
        Object.getOwnPropertySymbols(error).some((symbol) =>
            Object.prototype.propertyIsEnumerable.call(error, symbol),
        )
    ) {
        throw new TypeError('Enumerable symbol keys are not supported');
    }

    const dictionary: Record<string, ITransportSerializedStruct> = {};
    for (const key of Object.keys(error)) {
        if (!['name', 'message', 'stack', 'cause'].includes(key)) {
            dictionary[key] = serialize((error as any)[key]);
        }
    }

    const serialized: ISerializedError = {
        $key: ERROR_KEY,
        name: error.name,
        message: error.message,
        stack: error.stack,
        dictionary,
    };

    if (Object.prototype.hasOwnProperty.call(error, 'cause')) {
        serialized.cause = serialize((error as any).cause);
    }

    return serialized;
}

export function deserializeError(
    serializedError: ISerializedError,
    deserialize: TransportDeserializer,
): Error {
    let Constructor;

    switch (serializedError.name) {
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
    error.name = serializedError.name;

    if (typeof serializedError.stack === 'string') {
        error.stack = serializedError.stack;
    }

    if ('cause' in serializedError) {
        Object.defineProperty(error, 'cause', {
            value: deserialize(
                serializedError.cause as ITransportSerializedStruct,
            ),
            configurable: true,
            writable: true,
        });
    }

    for (const [key, value] of Object.entries(
        serializedError.dictionary || {},
    )) {
        (error as any)[key] = deserialize(value);
    }

    return error;
}
