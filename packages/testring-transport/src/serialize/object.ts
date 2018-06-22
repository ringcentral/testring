import { ISerializedStruct } from '../../interfaces';

export interface ISerializedObject extends ISerializedStruct {
    $key: string,
    dictionary: object
}

export const OBJECT_KEY = 'Object';

export const serializeObject = (object: object, serialize: (v: any) => ISerializedStruct): ISerializedObject => {
    const dictionary = {};

    for (let key in object) {
        if (!object.hasOwnProperty(key)) {
            continue;
        }

        dictionary[key] = serialize(object[key]);
    }

    return {
        $key: OBJECT_KEY,
        dictionary
    };
};

export const deserializeObject = (
    serializedObject: ISerializedObject,
    deserialize: (v: ISerializedStruct) => any
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
