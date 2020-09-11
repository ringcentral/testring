import { fsQueueServerHooks } from '@testring/fs-store';
import { IOnFileNameHookData, IOnFileReleaseHookData } from '@testring/types';
import { AbstractAPI } from './abstract';

export class FSQueueServerAPI extends AbstractAPI {
    onFileNameAssign(handler: (fileMetaData: IOnFileNameHookData) => Promise<IOnFileNameHookData>) {
        this.registryWritePlugin(fsQueueServerHooks.ON_FILENAME, handler);
    }

    onRelease(handler: (data: IOnFileReleaseHookData) => void) {
        this.registryReadPlugin(fsQueueServerHooks.ON_RELEASE, handler);
    }
}
