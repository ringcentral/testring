import * as deepmerge from 'deepmerge';

const emptyTarget = value => Array.isArray(value) ? [] : {};
const clone = (value, options) => deepmerge(emptyTarget(value), value, options);

function compressPlugins(target, source, options) {
    const destination = Array.from(target);

    source.forEach((element, index) => {
        /*
        if destination array has undefined element, we replace it with source element
        if destination array element can be merged, we merge it with source element
        if in destination array there is no such element we just push it into array,
        */
        if (typeof destination[index] === 'undefined') {
            destination[index] = options.isMergeableObject(element) ? clone(element, options) : element;
        } else if (options.isMergeableObject(element)) {
            destination[index] = deepmerge(target[index], element, options);
        } else if (target.indexOf(element) === -1) {
            destination.push(element);
        }
    });

    return destination;
}

export function mergeConfigs<T>(...configs: Array<Partial<T>>): T {
    return deepmerge.all(configs, { arrayMerge: compressPlugins });
}
