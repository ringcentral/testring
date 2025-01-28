import {
    requestMeta,
    FSStoreType,
    FSFileUniqPolicy,
    FSStoreDataOptions,
} from '@testring/types';
import {FSStoreFile} from './fs-store-file';

const baseMeta: requestMeta = {
    type: FSStoreType.screenshot,
    ext: 'png',
    uniqPolicy: FSFileUniqPolicy.global, //
};
const data: FSStoreDataOptions = {
    fsOptions: {encoding: 'binary' as BufferEncoding},
};

export function create(
    extraMeta?: requestMeta,
    extraData?: FSStoreDataOptions,
) {
    return new FSStoreFile({
        ...data,
        ...extraData,
        meta: {...baseMeta, ...extraMeta},
    });
}
