import {FSStoreClient} from './fs-store-client';

import {FS_CONSTANTS} from './utils';

const clients: Map<string, FSStoreClient> = new Map();

export default function fabric(
    prefix: string = FS_CONSTANTS['FS_DEFAULT_MSG_PREFIX'] ?? 'defaultPrefix',
) {
    if (!clients.has(prefix)) {
        clients.set(prefix, new FSStoreClient(prefix));
    }
    return clients.get(prefix) as FSStoreClient;
}
