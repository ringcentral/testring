import {
    IDevtoolRegisterScope,
    IDevtoolRegisterScopeVariable,
    ITransport,
    TestWorkerAction,
} from '@testring/types';

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

    constructor(
        private filename: string,
        private exportNamespace: symbol,
        private transport: ITransport,
    ) {}

    public clearScopes() {
        this.scopes.clear();
    }

    public registerGlobal(global: object) {
        this.global = global;
    }

    public registerVariable(scopeId: string, variableName: VariableKey, valueGetter: VariableGetter): void {
        if (this.scopes.has(scopeId)) {
            let scope = this.scopes.get(scopeId) as Scope;

            scope.vars[variableName] = valueGetter;

            this.transport.broadcastUniversally<IDevtoolRegisterScopeVariable>(TestWorkerAction.registerVariable, {
                filename: this.filename,
                scopeId,
                variableName,
            });
        }
    }

    public addVariable(scopeId: string, variableName: VariableKey, valueGetter: VariableGetter): void {
        const scope = this.scopes.get(scopeId);

        if (scope && !Object.prototype.hasOwnProperty.call(scope.vars, variableName)) {
            this.registerVariable(scopeId, variableName, valueGetter);
        }
    }

    public registerFunction(scopeId: string, parent: string, context: any, args: any[]): void {
        let initialScope: Partial<Scope> = {};
        if (this.scopes.has(scopeId)) {
            initialScope = this.scopes.get(scopeId) as Scope;
        }

        this.scopes.set(scopeId, {
            vars: {},
            ...initialScope,
            parent,
            context,
            args,
        });

        this.transport.broadcastUniversally<IDevtoolRegisterScope>(TestWorkerAction.registerScope, {
            filename: this.filename,
            scopeId,
        });
    }

    private getExportsNamespace(): object {
        return this.global.module.exports[this.exportNamespace];
    }

    public getScopeContext(scopeId: string | null) {
        if (scopeId === null) {
            return this.global;
        }

        if (!this.scopes.has(scopeId)) {
            throw new Error(`Scope ${scopeId} is not created yet`);
        }

        const scope = this.scopes.get(scopeId) as Scope;

        return new Proxy(scope.vars, {
            get: (target: any, key: string | number | symbol): any => {
                if (key === '__arguments') {
                    return scope.args;
                } else if (key === '__context') {
                    return scope.context;
                } else if (key === '__scopeExports') {
                    return this.getExportsNamespace()[scopeId];
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
                    return this.getExportsNamespace()[scopeId] = value;
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
