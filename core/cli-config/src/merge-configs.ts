import deepmerge from 'deepmerge';

const emptyTarget = (value: any) => (Array.isArray(value) ? [] : {});
const clone = (value: any, options: deepmerge.Options) => deepmerge(emptyTarget(value), value, options);

function mergePlugins(target: Array<any>, source: Array<any>, options: deepmerge.Options) {
    const plugins = {} as Record<string, any>;

    function putPluginIntoDictionary(element: any) {
        if (typeof element === 'string') {
            if (!(element in plugins)) {
                plugins[element] = null;
            }

            return;
        }

        if (Array.isArray(element)) {
            const plugin = element[0];
            const config = element[1] || {};

            if (!(plugin in plugins)) {
                plugins[plugin] = clone(config, options);
            } else {
                plugins[plugin] = deepmerge(plugins[plugin], config, options);
            }
        }
    }

    target.forEach(putPluginIntoDictionary);
    source.forEach(putPluginIntoDictionary);

    return Object.keys(plugins).map((pluginName) => {
        if (plugins[pluginName]) {
            return [pluginName, plugins[pluginName]];
        }
        return pluginName;
    });
}

function deepMergePlugins(pluginsList: any[], options: deepmerge.Options) {
    let plugins: any[] = [];

    for (const additionalPlugin of pluginsList) {
        plugins = mergePlugins(plugins, additionalPlugin, options);
    }

    return plugins;
}

export function mergeConfigs<T>(defaults: T, ...extensions: Partial<T>[]): T {
    const list = [defaults, ...extensions];
    const options = {} as deepmerge.Options;

    const plugins = deepMergePlugins(
        (list as any[]).map((obj) => (obj && obj.plugins ? obj.plugins : [])),
        options,
    );
    const source = deepmerge.all<T>(list, options);

    if (plugins.length > 0) {
        (source as any).plugins = plugins;
    }

    return source;
}
