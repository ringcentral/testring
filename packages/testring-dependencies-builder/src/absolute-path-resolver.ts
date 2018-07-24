const Module: any = module.constructor;

export const resolveAbsolutePath = (request: string, parentPath: string) => {
    const parent = {
        filename: parentPath,
        id: parentPath,
        paths: Module._nodeModulePaths(parentPath)
    };

    return Module._resolveFilename(request, parent, false);
};
