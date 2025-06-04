import * as vm from 'vm';
import * as path from 'path';
import {DependencyDict} from '@testring/types';
import {requirePackage} from '@testring/utils';
import {Script} from './script';

class Sandbox {
    private context: any;

    // Special flag for cyclic dependencies,
    // useful when module has recursive call of itself
    private isCompiling = false;

    private isCompiled = false;

    public exports = {};

    constructor(
        private source: string,
        private filename: string,
        private dependencies: DependencyDict,
    ) {
        this.context = this.createContext(this.filename, this.dependencies);
        Sandbox.modulesCache.set(filename, this);
    }

    public getContext() {
        return this.context;
    }

    public execute(): any {
        if (this.isCompiled || this.isCompiling) {
            return this.exports;
        }

        this.isCompiling = true;

        const context = vm.createContext(this.getContext());
        const script = new Script(this.source, this.filename);

        try {
            this.runInContext(script, context);
        } finally {
            this.isCompiled = true;
            this.isCompiling = false;
        }

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
        Sandbox.modulesCache.clear();
    }

    // TODO (flops) remove async
    public static async evaluateScript(
        filename: string,
        code: string,
    ): Promise<Sandbox> {
        if (!Sandbox.modulesCache.has(filename)) {
            throw new Error(`Sandbox ${filename} is not created`);
        }

        const sandbox = Sandbox.modulesCache.get(filename) as Sandbox;
        const context = vm.createContext(sandbox.getContext());
        const script = new Script(code, filename);

        sandbox.isCompiled = false;
        sandbox.isCompiling = true;

        await sandbox.runInContext(script, context);

        sandbox.isCompiled = true;
        sandbox.isCompiling = false;

        return sandbox;
    }

    private static modulesCache: Map<string, Sandbox> = new Map();

    private require(requestPath: string) {
        const dependencies = this.dependencies[this.filename];

        if (dependencies && dependencies[requestPath]) {
            const dependency = dependencies[requestPath];
            const depPath = dependency.path;
            const depContent = dependency.content;

            let dependencySandbox;

            if (Sandbox.modulesCache.has(depPath)) {
                dependencySandbox = Sandbox.modulesCache.get(depPath);
            } else {
                dependencySandbox = new Sandbox(
                    depContent,
                    depPath,
                    this.dependencies,
                );

                Sandbox.modulesCache.set(depPath, dependencySandbox);
            }

            return dependencySandbox ? dependencySandbox.execute() : undefined;
        }

        return requirePackage(requestPath, this.filename);
    }

    private createContext(filename: string, _dependencies: DependencyDict) {
        const moduleObject = {
            filename,
            id: filename,
        };

        const setter = (target: any, key: string, value: any): any => {
            switch (key) {
                case 'exports': {
                    return (this.exports = value);
                }

                default: {
                    return (target[key] = value);
                }
            }
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

            set: setter,
        });

        const ownContext = {
            __dirname: path.dirname(filename),
            __filename: filename,
            require: this.require.bind(this),
            module,
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

            set: setter,

            has: (target: any, key: string): boolean => {
                return key in target || key in global;
            },
        });

        return contextProxy;
    }
}

export {Sandbox};
