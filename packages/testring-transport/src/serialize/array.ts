import { ITransportSerializedStruct, TransportSerializer, TransportDeserializer } from '@testring/types';

export interface ISerializedArray extends ITransportSerializedStruct {
    $key: string;
    values: Array<ITransportSerializedStruct>;
}

export const ARRAY_KEY = 'Array';

export const serializeArray = (array: Array<any>, serialize: TransportSerializer): ISerializedArray => {
    return {
        $key: ARRAY_KEY,
        values: array.map((value) => serialize(value))
    };
};

export const deserializeArray = (
    serializedArray: ISerializedArray,
    deserialize: TransportDeserializer
): Array<any> => {
    return serializedArray.values.map((value) => deserialize(value));
};
