import { ISerializedStruct } from '../../interfaces';

export interface ISerializedArray extends ISerializedStruct {
    $key: string,
    values: Array<ISerializedStruct>
}

export const ARRAY_KEY = 'Array';

export const serializeArray = (array: Array<any>, serialize: (v: any) => ISerializedStruct): ISerializedArray => {
    return {
        $key: ARRAY_KEY,
        values: array.map((value) => serialize(value))
    };
};

export const deserializeArray = (
    serializedArray: ISerializedArray,
    deserialize: (v: ISerializedStruct) => any
): Array<any> => {
    return serializedArray.values.map((value) => deserialize(value));
};
