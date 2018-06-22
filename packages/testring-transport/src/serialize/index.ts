import { ISerializedStruct } from '../../interfaces';
import { ISerializedArray, serializeArray, deserializeArray, ARRAY_KEY } from './array';
import { ISerializedError, serializeError, deserializeError, ERROR_KEY } from './error';
import { ISerializedObject, serializeObject, deserializeObject, OBJECT_KEY } from './object';
import { ISerializedFunction, serializeFunction, deserializeFunction, FUNCTION_KEY } from './function';

const isAcceptable = (struct: any) => (
    typeof struct === 'number' ||
    typeof struct === 'string' ||
    typeof struct === 'boolean' ||
    typeof struct === 'undefined' ||
    struct === null
);

export const serialize = (struct: any) => {
    if (isAcceptable(struct)) {
        return struct;
    }

    if (struct instanceof Error) {
        return serializeError(struct);
    }

    if (Array.isArray(struct)) {
        return serializeArray(struct, serialize);
    }

    if (typeof struct === 'object') {
        return serializeObject(struct, serialize);
    }

    if (typeof struct === 'function') {
        return serializeFunction(struct);
    }
};

export const deserialize = (struct: ISerializedStruct) => {
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
    }
};
