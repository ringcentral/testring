import * as path from 'path';
import { requirePackage } from '@testring/utils';
import { Sandbox } from './sandbox';

export const createContext = (sandbox: Sandbox, filename: string) => {
    const moduleObject = {
        filename: filename,
        id: filename
    };

    const module = new Proxy(moduleObject, {
        get: (target: any, key: string): any => {
            switch (key) {
                case 'exports': {
                    return sandbox.exports;
                }

                default: {
                    return target[key];
                }
            }
        },

        set: (target: any, key: string, value: any): any => {
            switch (key) {
                case 'exports': {
                    return sandbox.exports = value;
                }

                default: {
                    return target[key] = value;
                }
            }
        }
    });

    const ownContext = {
        __dirname: path.dirname(filename),
        __filename: filename,
        require: (requestPath) => requirePackage(requestPath, filename),
        module: module
    };

    const contextProxy = new Proxy(ownContext, {
        get: (target: any, key: string): any => {
            switch (key) {
                case 'global': {
                    return contextProxy;
                }

                case 'exports': {
                    return sandbox.exports;
                }

                default: {
                    if (key in target) {
                        return target[key];
                    } else if (key in global) {
                        return (global as any)[key];
                    }

                    return undefined;
                }
            }
        },

        set: (target: any, key: string, value: any): any => {
            switch (key) {
                case 'exports': {
                    return sandbox.exports = value;
                }

                default: {
                    return target[key] = value;
                }
            }
        },

        has: (target: any, key: string): boolean => {
            return (key in target) || (key in global);
        }
    });

    return contextProxy;

};
