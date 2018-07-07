import { TestsFinderPlugins } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestFinderAPI extends AbstractAPI {
    onBeforeResolve(callback) {
        this.registryWritePlugin(TestsFinderPlugins.beforeResolve, callback);
    }

    onAfterResolve(callback) {
        this.registryWritePlugin(TestsFinderPlugins.afterResolve, callback);
    }
}
