import {
    ITransportSerializedStruct,
    TransportSerializer,
    TransportDeserializer,
} from '@testring/types';
import {
    ISerializedArray,
    serializeArray,
    deserializeArray,
    ARRAY_KEY,
} from './array';
import {
    ISerializedError,
    serializeError,
    deserializeError,
    ERROR_KEY,
} from './error';
import {
    ISerializedObject,
    serializeObject,
    deserializeObject,
    OBJECT_KEY,
} from './object';
import {
    ISerializedBuffer,
    serializeBuffer,
    deserializeBuffer,
    BUFFER_KEY,
} from './buffer';
import {
    ISerializedFunction,
    serializeFunction,
    deserializeFunction,
    FUNCTION_KEY,
} from './function';
import {
    ISerializedDate,
    serializeDate,
    deserializeDate,
    DATE_KEY,
} from './date';
import {
    ISerializedURL,
    serializeURL,
    deserializeURL,
    URL_KEY,
} from './url';

const UNDEFINED_KEY = 'Undefined';
const NUMBER_KEY = 'Number';
const BIGINT_KEY = 'BigInt';

const isAcceptable = (struct: any) =>
    (typeof struct === 'number' &&
        Number.isFinite(struct) &&
        !Object.is(struct, -0)) ||
    typeof struct === 'string' ||
    typeof struct === 'boolean' ||
    struct === null;

export const serialize: TransportSerializer = (rootStruct: any) => {
    const activeAncestors: Set<any> = new Set();

    const innerSerialize = (struct: any) => {
        if (isAcceptable(struct)) {
            return struct;
        }

        if (typeof struct === 'undefined') {
            return {$key: UNDEFINED_KEY};
        }

        if (typeof struct === 'number') {
            return {
                $key: NUMBER_KEY,
                data: Object.is(struct, -0) ? '-0' : String(struct),
            };
        }

        if (typeof struct === 'bigint') {
            return {$key: BIGINT_KEY, data: struct.toString()};
        }

        if (typeof struct === 'symbol') {
            throw new TypeError('Symbol values are not supported');
        }

        if (activeAncestors.has(struct)) {
            return '(Circular)';
        }

        activeAncestors.add(struct);

        try {
            if (struct instanceof Error) {
                return serializeError(struct, innerSerialize);
            }

            if (struct instanceof Buffer) {
                return serializeBuffer(struct);
            }

            if (struct instanceof Date) {
                return serializeDate(struct);
            }

            if (struct instanceof URL) {
                return serializeURL(struct);
            }

            if (Array.isArray(struct)) {
                return serializeArray(struct, innerSerialize);
            }

            if (typeof struct === 'function') {
                return serializeFunction(struct);
            }

            if (typeof struct === 'object') {
                const prototype = Object.getPrototypeOf(struct);
                if (
                    prototype !== null &&
                    prototype.constructor !== Object
                ) {
                    throw new TypeError(
                        `${struct.constructor?.name || 'Object'} values are not supported`,
                    );
                }

                return serializeObject(struct, innerSerialize);
            }

            throw new TypeError(`${typeof struct} values are not supported`);
        } finally {
            activeAncestors.delete(struct);
        }
    };

    return innerSerialize(rootStruct);
};

export const deserialize: TransportDeserializer = (
    struct: ITransportSerializedStruct,
) => {
    if (typeof struct === 'undefined') {
        return undefined;
    }

    if (isAcceptable(struct)) {
        return struct;
    }

    switch (struct.$key) {
        case UNDEFINED_KEY:
            return undefined;

        case NUMBER_KEY:
            return struct['data'] === '-0' ? -0 : Number(struct['data']);

        case BIGINT_KEY:
            return BigInt(struct['data']);

        case OBJECT_KEY:
            return deserializeObject(struct as ISerializedObject, deserialize);

        case ARRAY_KEY:
            return deserializeArray(struct as ISerializedArray, deserialize);

        case ERROR_KEY:
            return deserializeError(struct as ISerializedError, deserialize);

        case FUNCTION_KEY:
            return deserializeFunction(struct as ISerializedFunction);

        case BUFFER_KEY:
            return deserializeBuffer(struct as ISerializedBuffer);

        case DATE_KEY:
            return deserializeDate(struct as ISerializedDate);

        case URL_KEY:
            return deserializeURL(struct as ISerializedURL);
        default:
            return struct;
    }
};
