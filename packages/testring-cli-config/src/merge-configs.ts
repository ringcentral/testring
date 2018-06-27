import * as deepmerge from 'deepmerge';
import { IConfig } from '@testring/types';

const emptyTarget = value => Array.isArray(value) ? [] : {};
const clone = (value, options) => deepmerge(emptyTarget(value), value, options);

function compressPlugins(target, source, options) {
    const destination = Array.from(target);
    source.forEach(function(e, i) {
        /*
        if destination array has undefined element, we replace it with source element
        if destination array element can be merged, we merge it with source element
        if in destination array there is no such element we just push it into array,
        */
        if (typeof destination[i] === 'undefined') {
            destination[i] = options.isMergeableObject(e) ? clone(e, options) : e;
        } else if (options.isMergeableObject(e)) {
            destination[i] = deepmerge(target[i], e, options);
        } else if (target.indexOf(e) === -1) {
            destination.push(e);
        }
    });
    return destination;
}

export function mergeConfigs(configs): IConfig {
    return deepmerge.all(configs, { arrayMerge: compressPlugins });
}
