import { ITransportSerializedStruct, TransportSerializer, TransportDeserializer } from '@testring/types';
import { ISerializedArray, serializeArray, deserializeArray, ARRAY_KEY } from './array';
import { ISerializedError, serializeError, deserializeError, ERROR_KEY } from './error';
import { ISerializedObject, serializeObject, deserializeObject, OBJECT_KEY } from './object';
import { ISerializedBuffer, serializeBuffer, deserializeBuffer, BUFFER_KEY } from './buffer';
import { ISerializedFunction, serializeFunction, deserializeFunction, FUNCTION_KEY } from './function';
import { ISerializedDate, serializeDate, deserializeDate, DATE_KEY } from './date';

const isAcceptable = (struct: any) => (
    typeof struct === 'number' ||
    typeof struct === 'string' ||
    typeof struct === 'boolean' ||
    typeof struct === 'undefined' ||
    struct === null
);

export const serialize: TransportSerializer = (rootStruct: any) => {
    const processedStructs: Set<any> = new Set();

    const innerSerialize = (struct: any) => {
        if (isAcceptable(struct)) {
            return struct;
        }

        if (processedStructs.has(struct)) {
            return '(Circular)';
        }

        processedStructs.add(struct);

        if (struct instanceof Error) {
            return serializeError(struct);
        }

        if (struct instanceof Buffer) {
            return serializeBuffer(struct);
        }

        if (struct instanceof Date) {
            return serializeDate(struct);
        }

        if (Array.isArray(struct)) {
            return serializeArray(struct, innerSerialize);
        }

        if (typeof struct === 'object') {
            return serializeObject(struct, innerSerialize);
        }

        if (typeof struct === 'function') {
            return serializeFunction(struct);
        }
    };

    return innerSerialize(rootStruct);
};

export const deserialize: TransportDeserializer = (struct: ITransportSerializedStruct) => {
    if (isAcceptable(struct)) {
        return struct;
    }

    switch (struct.$key) {
        case OBJECT_KEY:
            return deserializeObject(struct as ISerializedObject, deserialize);

        case ARRAY_KEY:
            return deserializeArray(struct as ISerializedArray, deserialize);

        case ERROR_KEY:
            return deserializeError(struct as ISerializedError);

        case FUNCTION_KEY:
            return deserializeFunction(struct as ISerializedFunction);

        case BUFFER_KEY:
            return deserializeBuffer(struct as ISerializedBuffer);

        case DATE_KEY:
            return deserializeDate(struct as ISerializedDate);
    }
};
