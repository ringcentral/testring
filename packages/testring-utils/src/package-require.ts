import * as path from 'path';
import * as resolve from 'resolve';

export const resolvePackage = (modulePath: string, parentModule?: string): string => {
    try {
        if (typeof parentModule === 'string') {
            const parentModuleDir = path.dirname(parentModule);
            const relativeModulePath = path.resolve(parentModuleDir, modulePath);

            return require.resolve(relativeModulePath);
        }

        return require.resolve(modulePath);
    } catch {
        return resolve.sync(modulePath, {
            basedir: process.cwd()
        });
    }
};

export const requirePackage = (modulePath: string, parentModule?: string): any => {
    const fileName = resolvePackage(modulePath, parentModule);

    try {
        return require(fileName);
    } catch (exception) {
        throw new ReferenceError(`Can't find module "${modulePath}". Is it installed?`);
    }
};
