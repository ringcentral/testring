import * as path from 'path';
import * as resolve from 'resolve';

type webpackRequire = (...any) => any;
declare const __webpack_require__: webpackRequire | undefined;

export const isWebpack = () => typeof __webpack_require__ !== 'undefined';

const requireById = (id) => {
    return module.require(`${id}`);
};

const requireResolveById = (id, options?: {paths?: string[]}) => {
    return require.resolve(id, options);
};

export function resolvePackage(
    modulePath: string,
    parentModule?: string,
): string {
    if (isWebpack()) {
        throw Error("Can't use dynamic imports with webpack.");
    }

    try {
        if (typeof parentModule === 'string') {
            const parentModuleDir = path.dirname(parentModule);
            const relativeModulePath = path.resolve(
                parentModuleDir,
                modulePath,
            );

            try {
                return requireResolveById(relativeModulePath);
            } catch {
                return requireResolveById(modulePath);
            }
        }

        return requireResolveById(modulePath);
    } catch {
        return resolve.sync(modulePath, {
            basedir: process.cwd(),
        });
    }
}

export function requirePackage(modulePath: string, parentModule?: string): any {
    if (isWebpack()) {
        throw Error("Can't use dynamic imports with webpack.");
    }

    const fileName = resolvePackage(modulePath, parentModule);

    try {
        return requireById(fileName);
    } catch (exception) {
        const error = new ReferenceError(
            `Error, while requiring '${modulePath}': ${exception.message}`,
        );

        error.stack = exception.stack;

        throw error;
    }
}
