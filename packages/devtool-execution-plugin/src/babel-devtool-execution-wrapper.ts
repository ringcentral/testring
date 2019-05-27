import {
    ImportDeclaration,
    Program,
    FunctionDeclaration,
    BaseNode,
    Identifier,
    FunctionExpression,
    ArrowFunctionExpression,
    ExpressionStatement,
    Statement,
    VariableDeclaration,
    ReturnStatement,
    IfStatement,
    Node,
} from '@babel/types';
import { NodePath } from '@babel/traverse';

import * as t from '@babel/types';
import template from '@babel/template';

export const IMPORT_PATH = '@testring/devtool-execution-plugin';

const buildRequireTemplate = template(`
    var %%importName%% = null;
    try { %%importName%% = require("${IMPORT_PATH}"); } catch (err) { }
`);

const scopeWrapper = (callStatement: string) => `if (%%importName%%) { ${callStatement} }`;

const isScopeWrapper = (importName: Identifier, path: NodePath<Statement>): boolean => {
    if (path.isIfStatement()) {
        const testStatement = path.get('test');
        return testStatement.isIdentifier() && testStatement.node.name === importName.name;
    }

    return false;
};

const buildStartScopeTemplate = template(scopeWrapper(
'%%importName%%.broadcastStartScope(' +
    '%%filename%%, ' +
    '%%id%%, ' +
    '[%%startLine%%, %%startColumn%%, %%endLine%%, %%endColumn%%],' +
')'
));

const buildEndScopeTemplate = template(scopeWrapper('%%importName%%.broadcastStopScope(%%filename%%, %%id%%)'));

const arrowFunctionBodyTemplate = template('{ return %%statement%% }');

const getStartScopeTemplateByNode = (filename: string | null, importName: Identifier, id: string, node: BaseNode) => {
    if (node.loc) {
        const startLine = node.loc.start.line;
        const startColumn = node.loc.start.column;
        const endLine = node.loc.end.line;
        const endColumn = node.loc.end.column;

        return buildStartScopeTemplate({
            filename: filename ? t.stringLiteral(filename) : t.nullLiteral(),
            importName,
            id: t.stringLiteral(id),
            startLine: t.numericLiteral(startLine),
            startColumn: t.numericLiteral(startColumn),
            endLine: t.numericLiteral(endLine),
            endColumn: t.numericLiteral(endColumn),
        });
    }
};

const getEndScopeTemplateById = (filename: string | null, importName: Identifier, ids: string[]) => {
    const idLiterals = ids.map((id) => t.stringLiteral(id));

    return buildEndScopeTemplate({
        filename: filename ? t.stringLiteral(filename) : t.nullLiteral(),
        importName,
        id: t.arrayExpression(idLiterals),
    });
};

const unshiftContainer = (path: NodePath<Statement> | NodePath<Program>, statements: Statement | Statement[]): void => {
    (path as any).unshiftContainer('body', statements);
};

const pushContainer = (path: NodePath<Statement> | NodePath<Program>, statements: Statement | Statement[]): void => {
    (path as any).pushContainer('body', statements);
};

const findParentsWithScope = (path: NodePath<Node>, memo: string[] = []): string[] => {
    if (path.state && path.state.scopeId) {
        memo.push(path.state.scopeId);
    }

    if (
        path.isArrowFunctionExpression() || path.isFunctionDeclaration()
        || path.isFunctionExpression() || path.isProgram()
    ) {
        return Array.from(new Set(memo));
    } else if (path.parentPath) {
        return findParentsWithScope(path.parentPath, memo);
    } else {
        return Array.from(new Set(memo));
    }
};

export function devToolExecutionWrapper() {
    let importName: Identifier;

    let beginWrapper;
    let endWrapper;
    let isWrapper;

    let uniqId = 0;
    const generateId = () => {
        uniqId++;

        return `scope_${uniqId}`;
    };

    const returnStatementWrapper = (path: NodePath<ReturnStatement>): void => {
        const scopeIds = findParentsWithScope(path);

        if (scopeIds.length > 0) {
            path.insertBefore(endWrapper(scopeIds));
        }
    };

    const functionWrapper = (path: NodePath<FunctionDeclaration | FunctionExpression>): void  => {
        const body = path.get('body');
        const scopeId = generateId();

        path.state = {
            scopeId,
        };

        unshiftContainer(body, beginWrapper(scopeId, body.node));
        pushContainer(body, endWrapper([scopeId]));
    };

    const arrowFunctionWrapper = (path: NodePath<ArrowFunctionExpression>): void => {
        let body = path.get('body');
        const scopeId = generateId();

        if (!body.isBlockStatement()) {
            const replaceStatement = arrowFunctionBodyTemplate({ statement: body.node }) as Statement;

            body.replaceWith(replaceStatement);
            body = path.get('body');
        }

        if (body.isBlockStatement()) {
            path.state = {
                scopeId,
            };

            unshiftContainer(body, beginWrapper(scopeId, body.node));
            pushContainer(body, endWrapper([scopeId]));
        }
    };

    const expressionWrapper = (path: NodePath<VariableDeclaration | ExpressionStatement>): void => {
        const id = generateId();

        path.insertBefore(beginWrapper(id, path.node));
        path.insertAfter(endWrapper([id]));

        path.skip();
    };

    const ifStatementWrapper = (path: NodePath<IfStatement>, state): void => {
        if (isWrapper(path)) {
            path.skip();
        } else {
            const consequent = path.get('consequent');
            const consequentScopeId = generateId();

            if (consequent.isBlockStatement()) {
                consequent.state = {
                    scopeId: consequentScopeId,
                };

                unshiftContainer(consequent, beginWrapper(consequentScopeId, consequent.node));
                pushContainer(consequent, endWrapper([consequentScopeId]));

                // eslint-disable-next-line no-use-before-define
                subTraverseWithChildren(consequent, state);
            }


            const alternate = path.get('alternate');
            if (alternate.isBlockStatement()) {
                const alternateScopeId = generateId();
                alternate.state = {
                    scopeId: alternateScopeId,
                };

                unshiftContainer(alternate, beginWrapper(alternateScopeId, alternate.node));
                pushContainer(alternate, endWrapper([alternateScopeId]));

                // eslint-disable-next-line no-use-before-define
                subTraverseWithChildren(alternate, state);
            } else if (alternate.isIfStatement()) {
                // eslint-disable-next-line no-use-before-define
                subTravers(alternate, state);
            }

            path.skip();
        }
    };

    const visitors = {
        FunctionDeclaration: functionWrapper,
        FunctionExpression: functionWrapper,
        ArrowFunctionExpression: arrowFunctionWrapper,
        ExpressionStatement: expressionWrapper,
        VariableDeclaration: expressionWrapper,
        IfStatement: ifStatementWrapper,
        ReturnStatement: returnStatementWrapper,
    };


    const subTravers = (subPath: NodePath<Node>, state): void => {
        const visitorsCopy = { ...visitors };

        visitorsCopy[subPath.node.type] && visitorsCopy[subPath.node.type](subPath, state);
    };

    const subTraverseWithChildren = (subPath: NodePath<Node>, state): void => {
        subTravers(subPath, state);
        subPath.traverse({ ...visitors }, state);
    };

    return {
        name: '@testring/devtool-execution-plugin',

        visitor: {
            Program(path: NodePath<Program>, state) {
                importName = path.scope.generateUidIdentifier('$babelDevtoolExecutionWrapper');
                const importStatement = buildRequireTemplate({
                    importName,
                }) as Statement[];

                let lastImport: NodePath<ImportDeclaration> | undefined;

                path.get('body').forEach((node) => {
                    if (node.isImportDeclaration()) {
                        lastImport = node;
                    }
                });

                const importStatementCount = importStatement.length;
                const filename = state.file.opts.filename;

                beginWrapper = getStartScopeTemplateByNode.bind(null, filename, importName);
                endWrapper = getEndScopeTemplateById.bind(null, filename, importName);
                isWrapper = isScopeWrapper.bind(null, importName);


                if (lastImport !== undefined) {
                    lastImport.insertAfter(importStatement);
                    visitors[lastImport.node.type] && visitors[lastImport.node.type](lastImport, state);

                    const nextSiblings = lastImport.getAllNextSiblings();
                    for (let i = 0; i < nextSiblings.length; i++) {
                        if (i >= importStatementCount) {
                            const subPath = nextSiblings[i];
                            subTraverseWithChildren(subPath, state);
                        }
                    }

                    const prevSiblings = lastImport.getAllPrevSiblings();
                    for (let i = 0; i < prevSiblings.length; i++) {
                        const subPath = prevSiblings[i];
                        subTraverseWithChildren(subPath, state);
                    }
                } else {
                    unshiftContainer(path, importStatement);

                    path.get('body').forEach((subPath, i) => {
                        if (i >= importStatementCount) {
                            subTraverseWithChildren(subPath, state);
                        }
                    });
                }

                path.stop();
            },
        },
    };
}
