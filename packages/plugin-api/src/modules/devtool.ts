import { AbstractAPI } from './abstract';
import { DevtoolPluginHooks, IDevtoolServerConfig } from '@testring/types';

export class DevtoolAPI extends AbstractAPI {
    beforeStart(handler: (IRecorderServerConfig) => IDevtoolServerConfig) {
        this.registryWritePlugin(DevtoolPluginHooks.beforeStart, handler);
    }

    afterStart(handler: () => void) {
        this.registryWritePlugin(DevtoolPluginHooks.afterStart, handler);
    }

    beforeStop(handler: () => void) {
        this.registryWritePlugin(DevtoolPluginHooks.beforeStop, handler);
    }

    afterStop(handler: () => void) {
        this.registryWritePlugin(DevtoolPluginHooks.afterStop, handler);
    }
}

