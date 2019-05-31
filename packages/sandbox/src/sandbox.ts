import * as vm from 'vm';
import * as path from 'path';
import { DependencyDict } from '@testring/types';
import { requirePackage, resolvePackage } from '@testring/utils';
import * as devtoolExecutionPlugin from '@testring/devtool-execution-plugin';
import { Script } from './script';
import { ScopeManager } from './scope-manager';

class Sandbox {

    private context: any;
    private scopeManager: ScopeManager;
    static readonly exportNamespace: unique symbol = Symbol('scope.export');

    // Special flag for cyclic dependencies,
    // useful when module has recursive call of itself
    private isCompiling = false;

    private isCompiled = false;

    public exports = {
        [Sandbox.exportNamespace]: {},
    };

    constructor(
        private filename: string,
        private dependencies: DependencyDict,
    ) {
        this.scopeManager = new ScopeManager(filename, Sandbox.exportNamespace);
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
        for (let [, sandbox] of Sandbox.modulesCache) {
            sandbox.clear();
        }

        Sandbox.modulesCache.clear();
    }

    public static async evaluateScript(filename: string, source: string, fnPath: string | null = null): Promise<any> {
        if (!Sandbox.modulesCache.has(filename)) {
            throw new Error(`Sandbox ${filename} is not created`);
        }

        const sandbox = Sandbox.modulesCache.get(filename) as Sandbox;

        let result;
        try {
            const context = vm.createContext(sandbox.getScopeContext(fnPath));
            const script = new Script(source, filename);

            result = await sandbox.runInContext(script, context);
        } catch (error) {
            throw error;
        }

        return result;
    }

    public static getEvaluationResult(filename: string, fnPath: string): any {
        if (!Sandbox.modulesCache.has(filename)) {
            throw new Error(`Sandbox ${filename} is not created`);
        }

        const sandbox = Sandbox.modulesCache.get(filename) as Sandbox;

        return sandbox.exports[Sandbox.exportNamespace][fnPath];
    }

    public static clearEvaluationResult(filename: string, fnPath: string): void {
        if (!Sandbox.modulesCache.has(filename)) {
            throw new Error(`Sandbox ${filename} is not created`);
        }

        const sandbox = Sandbox.modulesCache.get(filename) as Sandbox;

        delete sandbox.exports[Sandbox.exportNamespace][fnPath];
    }

    private static modulesCache: Map<string, Sandbox> = new Map();

    private clear() {
        this.scopeManager.clearScopes();
    }

    private getScopeContext(fnPath: string | null) {
        return this.scopeManager.getScopeContext(fnPath);
    }

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

        // Devtool plugin
        if (requestPath === devtoolExecutionPlugin.IMPORT_PATH) {
            return devtoolExecutionPlugin;
        // Parsed dependency by key
        } else if ( dependenciesMap[requestPath] ) {
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
            __scopeManager: this.scopeManager,
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
                        return this.exports = {
                            ...value,
                            [Sandbox.exportNamespace]: this.exports[Sandbox.exportNamespace],
                        };
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

        this.scopeManager.registerGlobal(contextProxy);

        return contextProxy;
    }
}

export { Sandbox };
