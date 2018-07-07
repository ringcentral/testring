import { ITransportSerializedStruct } from '@testring/types';

export interface ISerializedBuffer extends ITransportSerializedStruct {
    $key: string;
    data: string;
}

export const BUFFER_KEY = 'Buffer';

export const serializeBuffer = (buffer: Buffer): ISerializedBuffer => {
    return {
        $key: BUFFER_KEY,
        data: buffer.toString()
    };
};

export const deserializeBuffer = (serializedBuffer: ISerializedBuffer): Buffer => {
    return Buffer.from(serializedBuffer.data);
};
