import * as deepmerge from 'deepmerge';
import { IConfig } from '@testring/types';

const emptyTarget = value => Array.isArray(value) ? [] : {};
const clone = (value, options) => deepmerge(emptyTarget(value), value, options);

function compressPlugins(target, source, options) {
    const destination = target.slice();

    source.forEach(function(e, i) {
        if (typeof destination[i] === 'undefined') {
            const cloneRequested = options.clone !== false;
            const shouldClone = cloneRequested && options.isMergeableObject(e);
            destination[i] = shouldClone ? clone(e, options) : e;
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
