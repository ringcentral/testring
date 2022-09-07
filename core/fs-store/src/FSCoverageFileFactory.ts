import {
    requestMeta,
    FSStoreType,
    FSFileUniqPolicy,
    FSStoreDataOptions,
} from '@testring-dev/types';
import {FSStoreFile} from './fs-store-file';

const baseMeta: requestMeta = {
    type: FSStoreType.coverage,
    uniqPolicy: FSFileUniqPolicy.worker, //
};
const data: FSStoreDataOptions = {
    fsOptions: {encoding: 'utf8' as BufferEncoding},
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
