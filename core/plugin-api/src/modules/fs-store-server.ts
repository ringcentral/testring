import {fsStoreServerHooks} from '@testring/fs-store';
import {IOnFileNameHookData, IOnFileReleaseHookData} from '@testring/types';
import {AbstractAPI} from './abstract';

export class FSStoreServerAPI extends AbstractAPI {
    onFileNameAssign(
        handler: (
            fileMetaData: IOnFileNameHookData,
        ) => Promise<IOnFileNameHookData>,
    ) {
        this.registryWritePlugin(fsStoreServerHooks.ON_FILENAME, handler);
    }

    onRelease(handler: (data: IOnFileReleaseHookData) => void) {
        this.registryReadPlugin(fsStoreServerHooks.ON_RELEASE, handler);
    }
}
