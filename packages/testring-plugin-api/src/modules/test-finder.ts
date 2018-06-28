import { TestsFinderPlugins } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestFinderAPI extends AbstractAPI {
    onBeforeResolve(callback) {
        this.registryAsyncPlugin(TestsFinderPlugins.beforeResolve, callback);
    }

    onAfterResolve(callback) {
        this.registryAsyncPlugin(TestsFinderPlugins.afterResolve, callback);
    }
}
