type Scope = {
    parent: string | null;
    context: any;
    args: any[];
    vars: object;
};


type VariableKey = string | number | symbol;
type VariableGetter = () => any;

export class ScopeManager {
    private global: any;
    private scopes: Map<string, Scope> = new Map();

    constructor(private filename: string, private exportNamespace: symbol) {
        // eslint-disable-next-line no-console
        console.log(this.filename);
    }

    public clearScopes() {
        this.scopes.clear();
    }

    public registerGlobal(global: object) {
        this.global = global;
    }

    public registerVariable(fnName: string, variableName: VariableKey, valueGetter: VariableGetter) {
        if (this.scopes.has(fnName)) {
            let scope = this.scopes.get(fnName) as Scope;

            scope.vars[variableName] = valueGetter;
        }
    }

    public addVariable(fnName: string, variableName: VariableKey, valueGetter: VariableGetter) {
        const scope = this.scopes.get(fnName);

        if (scope && !Object.prototype.hasOwnProperty.call(scope.vars, variableName)) {
            this.registerVariable(fnName, variableName, valueGetter);
        }
    }

    public registerFunction(fnName: string, parent: string, context: any, args: any[]) {
        let initialScope: Partial<Scope> = {};
        if (this.scopes.has(fnName)) {
            initialScope = this.scopes.get(fnName) as Scope;
        }

        this.scopes.set(fnName, {
            vars: {},
            ...initialScope,
            parent,
            context,
            args,
        });
    }

    private getExportsNamespace(): object {
        return this.global.module.exports[this.exportNamespace];
    }

    public getScopeContext(fnName: string | null) {
        if (fnName === null) {
            return this.global;
        }

        if (!this.scopes.has(fnName)) {
            throw new Error(`Scope ${fnName} is not created yet`);
        }

        const scope = this.scopes.get(fnName) as Scope;

        return new Proxy(scope.vars, {
            get: (target: any, key: string | number | symbol): any => {
                if (key === '__arguments') {
                    return scope.args;
                } else if (key === '__context') {
                    return scope.context;
                } else if (key === '__scopeExports') {
                    return this.getExportsNamespace()[fnName];
                }


                if (Object.prototype.hasOwnProperty.call(target, key)) {
                    try {
                        return target[key]();
                    } catch (e) {
                        return undefined;
                    }
                } else if (scope.parent !== null) {
                    const parentScope = this.getScopeContext(scope.parent) as object;

                    return parentScope[key];
                } else {
                    return this.global[key];
                }
            },
            set: (target: any, key: string | number | symbol, value: any): any => {
                if (key === '__arguments' || key === '__context') {
                    throw new Error(`Property ${key} is readonly`);
                } else if (key === '__scopeExports') {
                    return this.getExportsNamespace()[fnName] = value;
                }

                if (Object.prototype.hasOwnProperty.call(target, key)) {
                    target[key] = () => value;

                    return value;
                } else if (scope.parent !== null) {
                    const parentScope = this.getScopeContext(scope.parent) as object;

                    return parentScope[key] = value;
                } else {
                    return this.global[key] = value;
                }
            },
        });
    }
}
