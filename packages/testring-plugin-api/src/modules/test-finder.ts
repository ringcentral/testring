import { TestsFinderPlugins } from '@testring/test-finder';
import { AbstractAPI } from './abstract';

// TODO discuss API with team

export class TestFinderAPI extends AbstractAPI {
    onBeforeResolve(callback) {
        this.registryAsyncPlugin(TestsFinderPlugins.beforeResolve, callback);
    }

    onAfterResolve(callback) {
        this.registryAsyncPlugin(TestsFinderPlugins.afterResolve, callback);
    }
}
