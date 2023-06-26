import * as path from 'path';
import {requirePackage, resolvePackage} from './package-require';

const PREFIXES = ['@testring/plugin-', 'testring-plugin-', '@testring/'];

function normalizeExport(module) {
    // filtering null and other falsy values
    if (!module) {
        return module;
    }

    // returning original module, if it wasn't transformed by babel
    if (!module['__esModule']) {
        return module;
    }

    // returning default as default
    return module.default ? module.default : module;
}

export function requirePlugin(pluginPath: string): any {
    let resolvedPlugin;
    const parentModule = path.join(__dirname, '../..');

    const echo = pluginPath.includes('store');

    for (let index = 0; index < PREFIXES.length; index++) {
        try {
            resolvedPlugin = resolvePackage(
                PREFIXES[index] + pluginPath,
                parentModule,
            );
        } catch (e) {
            if (echo) {
                // eslint-disable-next-line no-console
                console.log('error', {path: PREFIXES[index] + pluginPath, parentModule});
            }
            continue;
        }
        break;
    }

    // eslint-disable-next-line no-console
    console.log('res', {resolvedPlugin});

    if (!resolvedPlugin) {
        resolvedPlugin = resolvePackage(pluginPath);
    }

    const plugin = requirePackage(resolvedPlugin);

    return normalizeExport(plugin);
}
