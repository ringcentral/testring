import * as resolve from 'resolve';

const getFilename = (modulePath: string): string => {
    try {
        return require.resolve(modulePath);
    } catch {
        return resolve.sync(modulePath, {
            basedir: process.cwd()
        });
    }
};

export const requirePackage = (modulePath: string) => {
    const fileName = getFilename(modulePath);

    try {
        return require(fileName);
    } catch (exception) {
        throw new ReferenceError(`Can't find plugin "${modulePath}". Is it installed?`);
    }
};
