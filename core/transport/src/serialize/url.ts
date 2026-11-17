import {ITransportSerializedStruct} from '@testring/types';

export interface ISerializedURL extends ITransportSerializedStruct {
    $key: string;
    data: string;
}

export const URL_KEY = 'URL';

export function serializeURL(url: URL): ISerializedURL {
    return {
        $key: URL_KEY,
        data: url.href,
    };
}

export function deserializeURL(serializedURL: ISerializedURL): URL {
    return new URL(serializedURL.data);
}
