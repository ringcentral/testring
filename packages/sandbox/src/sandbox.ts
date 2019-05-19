import * as vm from 'vm';
import * as path from 'path';
import { DependencyDict } from '@testring/types';
import { requirePackage, resolvePackage } from '@testring/utils';
import { Script } from './script';

class Sandbox {

    private context: any;

    // Special flag for cyclic dependencies,
    // useful when module has recursive call of itself
    private isCompiling = false;

    private isCompiled = false;

    public exports = {};

    constructor(
        private filename: string,
        private dependencies: DependencyDict,
    ) {
        this.context = this.createContext();
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

        /*
            Giving a time for node to load sourcemaps and only then set breakpoints
            in that case breakpoints won't fire on source file
         */

        try {
            const {
                source,
                transpiledSource,
            } = this.dependencies[this.filename];
            const isTranspiled = source === transpiledSource;
            const filename = isTranspiled ? `${this.filename}$` : this.filename;

            const script = new Script(transpiledSource, filename);

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

    public static async evaluateScript(filename: string, source: string): Promise<any> {
        if (!Sandbox.modulesCache.has(filename)) {
            throw new Error(`Sandbox ${filename} is not created`);
        }

        const sandbox = Sandbox.modulesCache.get(filename) as Sandbox;
        const context = vm.createContext(sandbox.getContext());
        const script = new Script(source, filename);

        sandbox.isCompiled = false;
        sandbox.isCompiling = true;

        let result;
        try {
            result = await sandbox.runInContext(script, context);
        } catch (error) {
            throw error;
        } finally {
            sandbox.isCompiled = true;
            sandbox.isCompiling = false;
        }

        return result;
    }

    private static modulesCache: Map<string, Sandbox> = new Map();

    private getSandbox(absolutePath) {
        let dependencySandbox;

        if (Sandbox.modulesCache.has(absolutePath)) {
            dependencySandbox = Sandbox.modulesCache.get(absolutePath);
        } else {
            dependencySandbox = new Sandbox(absolutePath, this.dependencies);

            Sandbox.modulesCache.set(absolutePath, dependencySandbox);
        }

        return dependencySandbox.execute();
    }

    private require(requestPath) {
        const dependenciesMap = this.dependencies[this.filename].dependencies;

        // Parsed dependency by key
        if ( dependenciesMap[requestPath] ) {
            const absolutePath = dependenciesMap[requestPath];

            return this.getSandbox(absolutePath);
        // Load sandbox if dependency is not parsed but we still have it in our dependency list
        } else if ( this.dependencies.hasOwnProperty(resolvePackage(requestPath)) ) {
            const absolutePath = this.dependencies[resolvePackage(requestPath)];

            return this.getSandbox(absolutePath);
        }

        return requirePackage(requestPath, this.filename);
    }

    private createContext() {
        const filename = this.filename;
        const moduleObject = {
            filename: filename,
            id: filename,
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
            },
        });

        const ownContext = {
            __dirname: path.dirname(filename),
            __filename: filename,
            require: this.require.bind(this),
            module: module,
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
            },
        });

        return contextProxy;
    }
}

export { Sandbox };
