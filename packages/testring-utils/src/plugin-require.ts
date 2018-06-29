import { requirePackage } from './package-require';

const normalizeExport = (module) => {
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
};

export const requirePlugin = (pluginPath: string) => {
    const plugin = requirePackage(pluginPath);

    return normalizeExport(plugin);
};
