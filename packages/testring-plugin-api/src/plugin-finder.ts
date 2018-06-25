const DEFAULT_PREFIX = '@testring/plugin-';
const EXTERNAL_DEFAULT_PREFIX = 'testring-plugin-';

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

// TODO add tests for it (somehow)
const resolvePluginName = (pluginName: string): string => {
    try {
        // Resolving shorten name
        // 'selenium-driver' => '@testring/plugin-selenium-driver'
        return require.resolve(DEFAULT_PREFIX + pluginName);
    } catch (e) {
        try {
            // Resolving external shorten name
            // 'selenium-driver' => 'testring-plugin-selenium-driver'
            return require.resolve(EXTERNAL_DEFAULT_PREFIX + pluginName);
        } catch (e) {
            // Resolving default name
            return require.resolve(pluginName);
        }
    }
};

export const findPlugin = (pluginName: string) => {
    let pluginPath;

    try {
        pluginPath = resolvePluginName(pluginName);
    } catch (exception) {
        throw new ReferenceError(`Can't find plugin "${pluginName}". Is it installed?`);
    }

    const plugin = require(pluginPath);

    return normalizeExport(plugin);
};
