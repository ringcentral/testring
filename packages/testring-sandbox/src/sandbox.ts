import * as vm from 'vm';
import * as path from 'path';
import { requirePackage } from '@testring/utils';
import { Script } from './script';

class Sandbox {

    private context: any;

    private isCompiled = false;

    public exports = {};

    constructor(private source: string, private filename: string, private dependencies: any) {
        this.context = this.createContext(this.filename, this.dependencies);
    }

    public getContext() {
        return this.context;
    }

    public execute(): any {
        if (this.isCompiled) {
            return this.exports;
        }

        const context = vm.createContext(this.context);

        let script;

        if (Sandbox.scriptCache.has(this.source)) {
            script = Sandbox.scriptCache.get(this.source);
        } else {
            script = new Script(this.source, this.filename);

            Sandbox.scriptCache.set(this.source, script);
        }

        this.runInContext(script, context);
        this.isCompiled = true;

        return this.exports;
    }

    private runInContext(script: Script, context: object): void {
        try {
            script.runInContext(context);
        } catch (exception) {
            if (typeof exception === 'string') {
                throw new EvalError(exception);
            } else {
                throw exception;
            }
        }
    }

    public static clearCache(): void {
        Sandbox.scriptCache.clear();
    }

    private static scriptCache: Map<string, Script> = new Map();


    private require(requestPath) {
        const dependencies = this.dependencies[this.filename];

        if (
            dependencies &&
            dependencies[requestPath]
        ) {
            const dependencySandbox = new Sandbox(
                dependencies[requestPath].content,
                dependencies[requestPath].path,
                this.dependencies
            );

            return dependencySandbox.execute();
        }

        return requirePackage(requestPath, this.filename);
    }

    private createContext(filename: string, dependencies) {
        const moduleObject = {
            filename: filename,
            id: filename
        };

        const module = new Proxy(moduleObject, {
            get: (target: any, key: string): any => {
                switch (key) {
                    case 'exports': {
                        return this.exports;
                    }

                    default: {
                        return target[key];
                    }
                }
            },

            set: (target: any, key: string, value: any): any => {
                switch (key) {
                    case 'exports': {
                        return this.exports = value;
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
            require: this.require.bind(this),
            module: module
        };

        const contextProxy = new Proxy(ownContext, {
            get: (target: any, key: string): any => {
                switch (key) {
                    case 'global': {
                        return contextProxy;
                    }

                    case 'exports': {
                        return this.exports;
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
                        return this.exports = value;
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
    }
}

export { Sandbox };
