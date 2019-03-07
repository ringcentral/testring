import * as deepmerge from 'deepmerge';

const emptyTarget = value => Array.isArray(value) ? [] : {};
const clone = (value, options) => deepmerge(emptyTarget(value), value, options);

function mergePlugins(target: Array<any>, source: Array<any>, options) {
    const plugins = {};

    function putPluginIntoDictionary(element) {
        if (typeof element === 'string') {
            if (!(element in plugins)) {
                plugins[element] = null;
            }

            return;
        }

        if (Array.isArray(element)) {
            const plugin = element[0];
            const config = element[1];

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
        } else {
            return pluginName;
        }
    });
}

function deepMergePlugins(pluginsList: any[], options) {
    let plugins: any[] = [];

    for (let additionalPlugin of pluginsList) {
        plugins = mergePlugins(plugins, additionalPlugin, options);
    }

    return plugins;
}

export function mergeConfigs<T>(defaults: T, ...extensions: Partial<T>[]): T {
    const list = [defaults, ...extensions];
    const options = {};

    const plugins = deepMergePlugins((list as any[]).map((obj) => obj && obj.plugins ? obj.plugins : []), options);
    const source = deepmerge.all<T>(list, options);

    if (plugins.length > 0) {
        (source as any).plugins = plugins;
    }

    return source;
}
