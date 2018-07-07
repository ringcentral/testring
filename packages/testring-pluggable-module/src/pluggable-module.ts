import { IPluggableModule } from '@testring/types';
import { Hook } from './hook';

type HookDescriptor = string;

export class PluggableModule implements IPluggableModule<Hook> {

    private pluginHooks: Map<string, Hook> = new Map();

    constructor(hooks: Array<HookDescriptor> = []) {
        this.createHooks(hooks);
    }

    private createHooks(hooks: Array<HookDescriptor> = []) {
        let hookName;

        for (let index = 0; index < hooks.length; index++) {
            hookName = hooks[index];

            this.pluginHooks.set(hookName, new Hook());
        }
    }

    protected async callHook<T = any>(name: string, ...args): Promise<T> {
        const pluginHook = this.pluginHooks.get(name);

        if (pluginHook === undefined) {
            throw new ReferenceError(`There is no plugin called ${name}.`);
        }

        return pluginHook.callHooks(...args);
    }

    public getHook(name: string) {
        return this.pluginHooks.get(name);
    }
}
