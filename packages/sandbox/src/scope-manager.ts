type Scope = {
    parent: string | null;
    context: any;
    args: any[];
    vars: object;
};

export class ScopeManager {
    private global: object;
    private scopes: Map<string, Scope> = new Map();

    constructor(private filename: string) {
        // eslint-disable-next-line no-console
        console.log(this.filename);
    }

    public registerGlobal(global: object) {
        this.global = global;
    }

    public registerVariable(fnName: string, variableName: string | number | symbol, valueGetter: () => any) {
        if (this.scopes.has(fnName)) {
            let scope = this.scopes.get(fnName) as Scope;

            scope.vars[variableName] = valueGetter;
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
