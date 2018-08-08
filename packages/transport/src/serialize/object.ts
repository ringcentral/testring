import { ITransportSerializedStruct, TransportSerializer, TransportDeserializer } from '@testring/types';

export interface ISerializedObject extends ITransportSerializedStruct {
    $key: string;
    dictionary: object;
}

export const OBJECT_KEY = 'Object';

export const serializeObject = (object: object, serialize: TransportSerializer): ISerializedObject => {
    const dictionary = {};

    for (let key in object) {
        if (key in object) {
            dictionary[key] = serialize(object[key]);
        }
    }

    return {
        $key: OBJECT_KEY,
        dictionary
    };
};

export const deserializeObject = (
    serializedObject: ISerializedObject,
    deserialize: TransportDeserializer
): object => {
    const dictionary = serializedObject.dictionary;
    const object = {};

    for (let key in dictionary) {
        if (!dictionary.hasOwnProperty(key)) {
            continue;
        }

        object[key] = deserialize(dictionary[key]);
    }

    return object;
};
