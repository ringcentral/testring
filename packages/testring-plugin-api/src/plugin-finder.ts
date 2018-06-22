
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

// TODO: cover with tests
export const findPlugin = (pluginName: string) => {
    const fileName = require.resolve(pluginName);

    try {
        const plugin = require(fileName);

        return normalizeExport(plugin);
    } catch (exception) {
        throw new ReferenceError(`Can't find plugin "${pluginName}". Is it installed?`);
    }
};
