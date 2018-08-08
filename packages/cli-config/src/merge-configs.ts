import * as deepmerge from 'deepmerge';

const emptyTarget = value => Array.isArray(value) ? [] : {};
const clone = (value, options) => deepmerge(emptyTarget(value), value, options);

function mergePlugins(target: Array<any>, source: Array<any>, options) {
    const plugins = {};

    const putPluginIntoDictionary = (element, index) => {
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
    };

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

export function mergeConfigs<T>(...configs: Array<Partial<T>>): T {
    return deepmerge.all(configs, { arrayMerge: mergePlugins });
}
