import { AbstractAPI } from './abstract';
import { RecorderPlugins, IRecorderServerConfig } from '@testring/types';

export class RecorderAPI extends AbstractAPI {
    beforeStart(handler: (IRecorderServerConfig) => IRecorderServerConfig) {
        this.registryWritePlugin(RecorderPlugins.beforeStart, handler);
    }

    afterStart(handler: () => void) {
        this.registryWritePlugin(RecorderPlugins.afterStart, handler);
    }

    beforeStop(handler: () => void) {
        this.registryWritePlugin(RecorderPlugins.beforeStop, handler);
    }

    afterStop(handler: () => void) {
        this.registryWritePlugin(RecorderPlugins.afterStop, handler);
    }
}

