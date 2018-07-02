import * as vm from 'vm';
import { Script } from './script';
import { createContext } from './context-creator';

class Sandbox {

    private context: any;

    private isCompiled = false;

    public exports = {};

    constructor(private source: string, private filename: string) {
        this.context = this.createContext(filename);
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

    private createContext(filename: string): object {
        return createContext(this, filename);
    }

    public static clearCache(): void {
        Sandbox.scriptCache.clear();
    }

    private static scriptCache: Map<string, Script> = new Map();
}

export { Sandbox };
