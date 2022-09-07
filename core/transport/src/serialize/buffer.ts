import {ITransportSerializedStruct} from '@testring-dev/types';

export interface ISerializedBuffer extends ITransportSerializedStruct {
    $key: string;
    data: string;
}

export const BUFFER_KEY = 'Buffer';

export function serializeBuffer(buffer: Buffer): ISerializedBuffer {
    return {
        $key: BUFFER_KEY,
        data: buffer.toString(),
    };
}

export function deserializeBuffer(serializedBuffer: ISerializedBuffer): Buffer {
    return Buffer.from(serializedBuffer.data);
}
