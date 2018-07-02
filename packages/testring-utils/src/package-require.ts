import * as resolve from 'resolve';

export const resolvePackage = (modulePath: string): string => {
    try {
        return require.resolve(modulePath);
    } catch {
        return resolve.sync(modulePath, {
            basedir: process.cwd()
        });
    }
};

export const requirePackage = (modulePath: string): any => {
    const fileName = resolvePackage(modulePath);

    try {
        return require(fileName);
    } catch (exception) {
        throw new ReferenceError(`Can't find plugin "${modulePath}". Is it installed?`);
    }
};
