import {
    ITransportSerializedStruct,
    TransportSerializer,
    TransportDeserializer,
} from '@testring-dev/types';

export interface ISerializedObject extends ITransportSerializedStruct {
    $key: string;
    dictionary: object;
}

export const OBJECT_KEY = 'Object';

export function serializeObject(
    object: object,
    serialize: TransportSerializer,
): ISerializedObject {
    const dictionary = {};

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
): object {
    const dictionary = serializedObject.dictionary;
    const object = {};

    for (const key in dictionary) {
        if (!Object.prototype.hasOwnProperty.call(dictionary, key)) {
            continue;
        }

        object[key] = deserialize(dictionary[key]);
    }

    return object;
}
