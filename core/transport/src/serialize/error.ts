import {
    ITransportSerializedStruct,
    TransportDeserializer,
    TransportSerializer,
} from '@testring/types';
import {addErrorDetails} from '@testring/utils';

export interface ISerializedError extends ITransportSerializedStruct {
    $key: string;
    name: string;
    message: string;
    stack: string | void;
    code?: string;
    cause?: ITransportSerializedStruct;
    causeOmitted?: true;
    details?: ITransportSerializedStruct;
    detailsOmitted?: true;
    dictionary?: Record<string, ITransportSerializedStruct>;
    type?: string;
}

export const ERROR_KEY = 'Error';
const MAX_CAUSE_DEPTH = 5;
const isRecord = (value: any): value is Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

function serializeCause(
    error: Error,
    serialize: TransportSerializer,
    causeDepth: number,
): Pick<ISerializedError, 'cause' | 'causeOmitted'> {
    const descriptor = Object.getOwnPropertyDescriptor(error, 'cause');
    if (!descriptor) {
        return {};
    }
    if (!('value' in descriptor)) {
        return {causeOmitted: true};
    }

    try {
        if (descriptor.value instanceof Error) {
            return causeDepth < MAX_CAUSE_DEPTH
                ? {
                      cause: serializeError(
                          descriptor.value,
                          serialize,
                          causeDepth + 1,
                      ),
                  }
                : {causeOmitted: true};
        }
        return {cause: serialize(descriptor.value)};
    } catch {
        return {causeOmitted: true};
    }
}

function serializeDetails(
    error: Error,
    serialize: TransportSerializer,
): Pick<ISerializedError, 'details' | 'detailsOmitted'> {
    const descriptor = Object.getOwnPropertyDescriptor(error, 'details');
    if (!descriptor) {
        return {};
    }
    if (!('value' in descriptor) || !isRecord(descriptor.value)) {
        return {detailsOmitted: true};
    }

    try {
        return {details: serialize(descriptor.value)};
    } catch {
        return {detailsOmitted: true};
    }
}

export function serializeError(
    error: Error,
    serialize: TransportSerializer,
    causeDepth = 0,
): ISerializedError {
    const serialized: ISerializedError = {
        $key: ERROR_KEY,
        name: error.name,
        type: error.name,
        message: error.message,
        stack: error.stack,
    };

    if ((error as Error & {causeOmitted?: boolean}).causeOmitted) {
        serialized.causeOmitted = true;
    }
    if ((error as Error & {detailsOmitted?: boolean}).detailsOmitted) {
        serialized.detailsOmitted = true;
    }

    Object.assign(
        serialized,
        serializeCause(error, serialize, causeDepth),
        serializeDetails(error, serialize),
    );

    const code = Object.getOwnPropertyDescriptor(error, 'code');
    if (code && 'value' in code && typeof code.value === 'string') {
        serialized.code = code.value;
    }

    return serialized;
}

export function deserializeError(
    serializedError: ISerializedError,
    deserialize: TransportDeserializer,
): Error {
    let Constructor;

    switch (serializedError.name || serializedError.type) {
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
    error.name = serializedError.name || serializedError.type || 'Error';

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

    if (typeof serializedError.code === 'string') {
        (error as Error & {code?: string}).code = serializedError.code;
    }

    if ('details' in serializedError) {
        const details = deserialize(
            serializedError.details as ITransportSerializedStruct,
        );
        if (isRecord(details)) {
            addErrorDetails(error, details);
        } else {
            (error as Error & {detailsOmitted?: boolean}).detailsOmitted = true;
        }
    }

    if (serializedError.causeOmitted) {
        (error as Error & {causeOmitted?: boolean}).causeOmitted = true;
    }
    if (serializedError.detailsOmitted) {
        (error as Error & {detailsOmitted?: boolean}).detailsOmitted = true;
    }

    // Read errors produced by the previous codec while rolling packages forward.
    for (const [key, value] of Object.entries(
        serializedError.dictionary || {},
    )) {
        (error as any)[key] = deserialize(value);
    }

    return error;
}
