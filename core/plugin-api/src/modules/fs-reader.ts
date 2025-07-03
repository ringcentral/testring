import {FSReaderPlugins} from '@testring/types';
import {AbstractAPI} from './abstract';

export class FSReaderAPI extends AbstractAPI {
    onBeforeResolve(callback: (...args: Array<any>) => any | Promise<any>) {
        this.registryWritePlugin(FSReaderPlugins.beforeResolve, callback);
    }

    onAfterResolve(callback: (...args: Array<any>) => any | Promise<any>) {
        this.registryWritePlugin(FSReaderPlugins.afterResolve, callback);
    }
}
