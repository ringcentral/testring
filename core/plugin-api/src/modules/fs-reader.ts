import {FSReaderPlugins} from '@testring-dev/types';
import {AbstractAPI} from './abstract';

export class FSReaderAPI extends AbstractAPI {
    onBeforeResolve(callback) {
        this.registryWritePlugin(FSReaderPlugins.beforeResolve, callback);
    }

    onAfterResolve(callback) {
        this.registryWritePlugin(FSReaderPlugins.afterResolve, callback);
    }
}
