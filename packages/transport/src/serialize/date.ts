import { ITransportSerializedStruct } from '@testring/types';

export interface ISerializedDate extends ITransportSerializedStruct {
    $key: string;
    data: number;
}

export const DATE_KEY = 'Date';

export function serializeDate(date: Date): ISerializedDate {
    return {
        $key: DATE_KEY,
        data: date.getTime(),
    };
}

export function deserializeDate(serializedDate: ISerializedDate): Date {
    return new Date(serializedDate.data);
}
