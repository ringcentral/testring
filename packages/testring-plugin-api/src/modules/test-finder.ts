import { FSReaderPlugins } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestFinderAPI extends AbstractAPI {
    onBeforeResolve(callback) {
        this.registryWritePlugin(FSReaderPlugins.beforeResolve, callback);
    }

    onAfterResolve(callback) {
        this.registryWritePlugin(FSReaderPlugins.afterResolve, callback);
    }
}
