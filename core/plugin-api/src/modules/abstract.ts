import {IPluggableModule} from '@testring/types';

export class AbstractAPI {
    constructor(
        protected pluginName: string,
        protected module: IPluggableModule,
    ) {}

    protected registryReadPlugin(hookName: string, callback: any) {
        const hook = this.module.getHook(hookName);

        if (hook) {
            hook.readHook(this.pluginName, callback);
        }
    }

    protected registryWritePlugin(
        hookName: string,
        callback: (...args: Array<any>) => any | Promise<any>,
    ) {
        const hook = this.module.getHook(hookName);

        if (hook) {
            hook.writeHook(this.pluginName, callback);
        }
    }
}
