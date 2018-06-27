import { AsyncSeriesWaterfallHook } from 'tapable';
import { IPluggableModule } from '@testring/types';

type HookDescriptor = string | [string, number];

export class PluggableModule implements IPluggableModule<AsyncSeriesWaterfallHook> {

    private pluginHooks: Map<string, AsyncSeriesWaterfallHook> = new Map();

    constructor(hooks: Array<HookDescriptor> = []) {
        this.createHooks(hooks);
    }

    private createHookArguments(number) {
        return Array.from({ length: number }, (v, index) => `arg${index}`);
    }

    private createHooks(hooks: Array<HookDescriptor> = []) {
        let hook;
        let hookName;
        let hookArguments;

        for (let index = 0; index < hooks.length; index++) {
            hook = hooks[index];

            if (typeof hook === 'string') {
                hookName = hook;
                hookArguments = 1;
            } else {
                hookName = hook[0];
                hookArguments = hook[1];
            }

            this.pluginHooks.set(
                hookName,
                new AsyncSeriesWaterfallHook(this.createHookArguments(hookArguments))
            );
        }
    }

    protected callHook<T = any>(name: string, ...args): Promise<T> {
        const pluginHook = this.pluginHooks.get(name);

        if (pluginHook) {
            return new Promise((resolve, reject) => {
                pluginHook.callAsync(...args, (error, data) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data || args[0]);
                    }
                });
            });
        }

        return Promise.reject(`There is no plugin called ${name}.`);
    }

    public getHook(name: string) {
        return this.pluginHooks.get(name);
    }
}
