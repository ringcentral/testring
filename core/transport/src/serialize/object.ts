import {
    ITransportSerializedStruct,
    TransportSerializer,
    TransportDeserializer,
} from '@testring/types';

export interface ISerializedObject extends ITransportSerializedStruct {
    $key: string;
    dictionary: Record<string, unknown>;
}

export const OBJECT_KEY = 'Object';

export function serializeObject(
    object: Record<string, unknown>,
    serialize: TransportSerializer,
): ISerializedObject {
    const dictionary: Record<string, unknown> = {};

    for (const key in object) {
        if (key in object) {
            dictionary[key] = serialize(object[key]);
        }
    }

    return {
        $key: OBJECT_KEY,
        dictionary,
    };
}

export function deserializeObject(
    serializedObject: ISerializedObject,
    deserialize: TransportDeserializer,
): Record<string, unknown> {
    const dictionary = serializedObject.dictionary;
    const object: Record<string, unknown> = {};

    for (const key in dictionary) {
        if (!Object.prototype.hasOwnProperty.call(dictionary, key)) {
            continue;
        }

        object[key] = deserialize(dictionary[key] as ITransportSerializedStruct);
    }

    return object;
}
