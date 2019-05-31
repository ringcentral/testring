import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import {
    ArrayExpression,
    ArrowFunctionExpression,
    BaseNode,
    BlockStatement,
    BreakStatement,
    ContinueStatement,
    Expression,
    ExpressionStatement,
    Function,
    FunctionDeclaration,
    FunctionExpression,
    Identifier,
    IfStatement,
    ImportDeclaration,
    Literal,
    Loop,
    Node,
    NumericLiteral,
    Program,
    ReturnStatement,
    Statement,
    StringLiteral,
    SwitchStatement,
    VariableDeclaration,
} from '@babel/types';
import template, { PublicReplacements } from '@babel/template';
import { DevtoolScopeType } from '@testring/types';

import { IMPORT_PATH } from './constants';
import { getFunctionPath } from './helpers';


type StartScopeWrapperArgs = {
    filename: StringLiteral;
    importName: Identifier;
    id: StringLiteral;
    type: StringLiteral;
    startLine: NumericLiteral;
    startColumn: NumericLiteral;
    endLine: NumericLiteral;
    endColumn: NumericLiteral;
};

type StartScopeWrapper = (args: PublicReplacements & StartScopeWrapperArgs) => IfStatement;

type StopScopeWrapperArgs = {
    filename: StringLiteral;
    importName: Identifier;
    ids: ArrayExpression;
}

type EndScopeWrapper = (args: PublicReplacements & StopScopeWrapperArgs) => IfStatement;


const blockStatementWithReturnTpl = template('{ return %%statement%% }');
const blockStatementTpl = template('{ %%statement%% }');

export class BabelDevtoolTransform {
    private pluginName = 'babel-testring-transform-plugin';

    // Variables
    private importName: Identifier;
    private fileName: string;
    private generateId: () => string;

    private startScopeTemplate: StartScopeWrapper;
    private endScopeTemplate: EndScopeWrapper;

    constructor() {}

    // Templates
    private scopeWrapper(callStatement: string): string {
        return `if (%%importName%%) { ${callStatement} }`;
    }

    private isScopeWrapper(
        path: NodePath<Node>,
        importName: Identifier = this.importName,
    ): boolean {
        if (path.isIfStatement()) {
            const testStatement = path.get('test');
            return testStatement.isIdentifier() && testStatement.node.name === importName.name;
        }

        return false;
    }

    private getBlockStatement(statement: Statement | Expression): BlockStatement {
        return blockStatementTpl({ statement }) as BlockStatement;
    }

    private getBlockStatementWithReturn(statement: Statement | Expression): BlockStatement {
        return blockStatementWithReturnTpl({ statement }) as BlockStatement;
    }

    private buildRequireTemplate(importName: Identifier = this.importName): Statement[] {
        const statement = template(
            'var %%importName%% = null;' +
            'try { ' +
                `%%importName%% = require("${IMPORT_PATH}");` +
            ' } catch (err) { }'
        );

        return statement({ importName }) as Statement[];
    }

    private getStartScopeTemplate(): StartScopeWrapper {
        if (!this.startScopeTemplate) {
            this.startScopeTemplate = template(this.scopeWrapper(
                '%%importName%%.startScope(' +
                    '%%filename%%, ' +
                    '%%id%%, ' +
                    '[%%startLine%%, %%startColumn%%, %%endLine%%, %%endColumn%%],' +
                    '%%type%%' +
                ')'
            )) as StartScopeWrapper;
        }

        return this.startScopeTemplate;
    }

    private getEndScopeTemplate(): EndScopeWrapper {
        if (!this.endScopeTemplate) {
            this.endScopeTemplate = template(this.scopeWrapper(
                '%%importName%%.endScope(%%filename%%, %%ids%%)'
            )) as EndScopeWrapper;
        }

        return this.endScopeTemplate;
    }

    private startScopeStatement(
        id: string,
        node: BaseNode,
        type: DevtoolScopeType = DevtoolScopeType.block,
        filename: string = this.fileName,
        importName: Identifier = this.importName,
    ): IfStatement {
        if (node.loc) {
            const startLine = node.loc.start.line;
            const startColumn = node.loc.start.column;
            const endLine = node.loc.end.line;
            const endColumn = node.loc.end.column;

            return this.getStartScopeTemplate()({
                filename: t.stringLiteral(filename),
                type: t.stringLiteral(type),
                importName,
                id: t.stringLiteral(id),
                startLine: t.numericLiteral(startLine),
                startColumn: t.numericLiteral(startColumn),
                endLine: t.numericLiteral(endLine),
                endColumn: t.numericLiteral(endColumn),
            });
        } else {
            throw new Error('Invalid block type, has no location in it');
        }
    }

    private endScopeStatement(
        ids: string[],
        filename: string = this.fileName,
        importName: Identifier = this.importName,
    ): IfStatement {
        const idLiterals = ids.map((id) => t.stringLiteral(id));

        return this.getEndScopeTemplate()({
            filename: t.stringLiteral(filename),
            importName,
            ids: t.arrayExpression(idLiterals),
        });
    }


    public static getBabelPlugin() {
        const plugin = new BabelDevtoolTransform();

        return {
            name: plugin.pluginName,

            visitor: {
                Program: {
                    enter:  (path: NodePath<Program>, state) => plugin.programVisitor(path, state),
                },
            },
        };
    }

    // Helpers
    private unshiftContainer(
        path: NodePath<Statement | Program>,
        statements: Statement | Literal | Statement[]
    ): void {
        (path as any).unshiftContainer('body', statements);
    }

    private pushContainer(
        path: NodePath<Statement | Program>,
        statements: Statement | Literal | Statement[]
    ): void {
        (path as any).pushContainer('body', statements);
    }

    private subTraverse(subPath: NodePath<Node>, state): void {
        const visitors = this.getVisitors();

        visitors[subPath.node.type] && visitors[subPath.node.type](subPath, state);
    }

    private subTraverseWithChildren(subPath: NodePath<Node>, state) {
        this.subTraverse(subPath, state);

        subPath.traverse(this.getVisitors(), state);
    }

    private generateUidIdentifier(path: NodePath<Program>) {
        return path.scope.generateUidIdentifier('$testringDevtool');
    }

    private getVisitors() {
        return {
            FunctionDeclaration: (path, state) => this.functionVisitor(path, state),
            FunctionExpression: (path, state) => this.functionVisitor(path, state),
            ArrowFunctionExpression: (path, state) => this.arrowFunctionVisitor(path, state),

            IfStatement: (path, state) => this.ifStatementVisitor(path, state),
            SwitchStatement: (path, state) => this.switchStatementVisitor(path, state),
            Loop: (path, state) => this.loopVisitor(path, state),

            ExpressionStatement: (path, state) => this.expressionStatementVisitor(path, state),
            VariableDeclaration: (path, state) => this.variableDeclarationVisitor(path, state),

            ReturnStatement: (path, state) => this.returnStatementVisitor(path, state),
            BreakStatement: (path, state) => this.breakStatementVisitor(path, state),
            ContinueStatement: (path, state) => this.continueStatementVisitor(path, state),
        };
    }

    private findParentScopes(
        path: NodePath<Node>,
        stopNodeFilter: (path: NodePath<Node>) => boolean,
        memo: string[] = []
    ): string[] {
        if (path.state && path.state.scopeId) {
            memo.push(path.state.scopeId);
        }

        if (stopNodeFilter(path) || path.isProgram()) {
            return Array.from(new Set(memo));
        } else if (path.parentPath) {
            return this.findParentScopes(path.parentPath, stopNodeFilter, memo);
        } else {
            return Array.from(new Set(memo));
        }
    }


    // Visitors
    private programVisitor(path: NodePath<Program>, state): void {
        if (!state.file.opts.filename) {
            throw Error('Filename is required');
        }
        let uniqId = 0;

        this.fileName = state.file.opts.filename;
        this.importName = this.generateUidIdentifier(path);
        this.generateId = () => {
            uniqId++;

            return `scope_${uniqId}`;
        };

        const injectStatement = this.buildRequireTemplate();
        const injectStatementLength = injectStatement.length;
        const visitors = this.getVisitors();

        let lastImport: NodePath<ImportDeclaration> | undefined;

        path.get('body').forEach((node) => {
            if (node.isImportDeclaration()) {
                lastImport = node;
            }
        });


        if (lastImport !== undefined) {
            lastImport.insertAfter(injectStatement);
            visitors[lastImport.node.type] && visitors[lastImport.node.type](lastImport, state);

            const nextSiblings = lastImport.getAllNextSiblings();
            for (let i = 0; i < nextSiblings.length; i++) {
                if (i >= injectStatementLength) {
                    const subPath = nextSiblings[i];
                    this.subTraverseWithChildren(subPath, state);
                }
            }

            const prevSiblings = lastImport.getAllPrevSiblings();
            for (let i = 0; i < prevSiblings.length; i++) {
                const subPath = prevSiblings[i];
                this.subTraverseWithChildren(subPath, state);
            }
        } else {
            this.unshiftContainer(path, injectStatement);

            path.get('body').forEach((subPath, i) => {
                if (i >= injectStatementLength) {
                    this.subTraverseWithChildren(subPath, state);
                }
            });
        }

        path.stop();
    }

    private ifStatementVisitor(path: NodePath<IfStatement>, state): void {
        if (this.isScopeWrapper(path)) {
            path.skip();
            return;
        }

        const consequent = path.get('consequent');

        if (consequent.isBlockStatement()) {
            const consequentScopeId = this.generateId();
            consequent.state = {
                scopeId: consequentScopeId,
            };

            this.unshiftContainer(consequent, this.startScopeStatement(consequentScopeId, consequent.node));
            this.pushContainer(consequent, this.endScopeStatement([consequentScopeId]));

            this.subTraverseWithChildren(consequent, state);
        }

        const alternate = path.get('alternate');
        if (alternate.isBlockStatement()) {
            const alternateScopeId = this.generateId();
            alternate.state = {
                scopeId: alternateScopeId,
            };

            this.unshiftContainer(alternate, this.startScopeStatement(alternateScopeId, alternate.node));
            this.pushContainer(alternate, this.endScopeStatement([alternateScopeId]));

            this.subTraverseWithChildren(alternate, state);
        } else if (alternate.isIfStatement()) {
            this.subTraverse(alternate, state);
        }

        path.skip();
    }

    private switchStatementVisitor(path: NodePath<SwitchStatement>, state): void {
        const scopeId = this.generateId();

        path.state = {
            ...path.state,
            scopeId,
        };

        path.insertBefore(this.startScopeStatement(scopeId, path.node));
        path.insertAfter(this.endScopeStatement([scopeId]));
    }

    private loopVisitor(path: NodePath<Loop>, state): void {
        let body = path.get('body');

        if (!body.isBlockStatement()) {
            const replaceStatement = this.getBlockStatement(body.node);

            body.replaceWith(replaceStatement);
            body = path.get('body');
        }

        if (body.isBlockStatement()) {
            const scopeId = this.generateId();

            path.state = {
                ...path.state,
                scopeId,
            };

            this.unshiftContainer(body, this.startScopeStatement(scopeId, body.node));
            this.pushContainer(body, this.endScopeStatement([scopeId]));
        }
    }

    private arrowFunctionVisitor(path: NodePath<ArrowFunctionExpression>, state): void {
        let body = path.get('body');

        if (!body.isBlockStatement()) {
            const replaceStatement = this.getBlockStatementWithReturn(body.node);

            body.replaceWith(replaceStatement);
            body = path.get('body');
        }

        if (body.isBlockStatement()) {
            const scopeId = this.generateId();

            path.state = {
                ...path.state,
                scopeId,
            };

            this.unshiftContainer(body, this.startScopeStatement(scopeId, body.node));
            this.pushContainer(body, this.endScopeStatement([scopeId]));
        }
    }

    private getVariableRegisterInject(fnName: string, variable: Identifier): Statement {
        return template(
            'global.__scopeManager && global.__scopeManager.registerVariable(' +
                '%%fnName%%, ' +
                '%%variableName%%, ' +
                '() => { return %%variableIdentifier%% }' +
            ')'
        )({
            fnName: t.stringLiteral(fnName),
            variableIdentifier: variable,
            variableName: t.stringLiteral(variable.name),
        }) as Statement;
    }

    private functionScopeInject(path: NodePath<Function>, state): void {
        const fnName = getFunctionPath(path);

        if (fnName) {
            path.state = {
                ...path.state,
                fnName,
            };

            const fnParentName = getFunctionPath(path.parentPath);

            const bindings = path.scope.getAllBindings();
            const variableStatements: Statement[] = Object.entries(bindings)
                .reduce((memo: Statement[], [key, binding]) => {
                    if (path.scope.hasOwnBinding(key)) {
                        const identifier = binding.identifier as Identifier;
                        memo.push(this.getVariableRegisterInject(fnName, identifier));
                    }

                    return memo;
                }, []);

            const inject = template(this.scopeWrapper(
                'global.__scopeManager && global.__scopeManager.registerFunction(' +
                    '%%fnName%%, ' +
                    '%%fnParentName%%, ' +
                    'this, ' +
                    'arguments' +
                ');' +
                '%%variableStatements%%'
            ))({
                importName: this.importName,
                fnName: t.stringLiteral(fnName),
                fnParentName: fnParentName === null ? t.nullLiteral() : t.stringLiteral(fnParentName),
                variableStatements,
            }) as IfStatement;

            this.unshiftContainer(path.get('body') as NodePath<BlockStatement>, inject);
        }
    }

    private functionVisitor(path: NodePath<FunctionDeclaration | FunctionExpression>, state): void {
        const body = path.get('body');
        const scopeId = this.generateId();

        path.state = {
            ...path.state,
            scopeId,
        };

        this.functionScopeInject(path, state);

        this.unshiftContainer(body, this.startScopeStatement(scopeId, body.node));
        this.pushContainer(body, this.endScopeStatement([scopeId]));
    }

    private expressionStatementVisitor(path: NodePath<ExpressionStatement>, state): void {
        const id = this.generateId();
        const exp = path.get('expression');

        let type = DevtoolScopeType.block;
        if (exp && (exp.isCallExpression() || exp.isAwaitExpression())) {
            type = DevtoolScopeType.inline;
        }

        if (exp && exp.isAssignmentExpression()) {
            const right = path.get('right') as NodePath<Expression>;

            if (!right.isFunction()) {
                type = DevtoolScopeType.inline;
            }

            this.subTraverseWithChildren(right, state);
            path.skip();
        }

        path.insertBefore(this.startScopeStatement(id, path.node, type));
        path.insertAfter(this.endScopeStatement([id]));
    }

    private variableDeclarationVisitor(path: NodePath<VariableDeclaration>, state): void {
        const id = this.generateId();

        path.insertBefore(this.startScopeStatement(id, path.node, DevtoolScopeType.inline));
        path.insertAfter(this.endScopeStatement([id]));
    }

    private returnStatementVisitor(path: NodePath<ReturnStatement>, state): void {
        const scopeStop = (path: NodePath<Node>) => path.isArrowFunctionExpression()
            || path.isFunctionDeclaration()
            || path.isFunctionExpression();

        const scopeIds = this.findParentScopes(path, scopeStop);

        if (scopeIds.length > 0) {
            path.insertBefore(this.endScopeStatement(scopeIds));
        }
    }

    private breakStatementVisitor(path: NodePath<BreakStatement>, state): void {
        const scopeStop = (path: NodePath<Node>) => path.isLoop() || path.isSwitchStatement();

        const scopeIds = this.findParentScopes(path, scopeStop);

        if (scopeIds.length > 0) {
            path.insertBefore(this.endScopeStatement(scopeIds));
        }
    }

    private continueStatementVisitor(path: NodePath<ContinueStatement>, state): void {
        const scopeStop = (path: NodePath<Node>) => path.isLoop();

        const scopeIds = this.findParentScopes(path, scopeStop);

        if (scopeIds.length > 0) {
            path.insertBefore(this.endScopeStatement(scopeIds));
        }
    }
}
