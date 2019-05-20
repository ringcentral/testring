import {
    Statement,
    ImportDeclaration,
    Program,
    FunctionDeclaration,
    BaseNode,
    Identifier,
    FunctionExpression,
    ArrowFunctionExpression,
    ExpressionStatement,
} from '@babel/types';

import * as t from '@babel/types';
import template from '@babel/template';
import { NodePath } from '@babel/traverse';


export const IMPORT_PATH = '@testring/devtool-execution-wrapper';

const buildRequireTemplate = template(`
    var %%importName%% = null;
    try { %%importName%% = require("${IMPORT_PATH}"); } catch (err) { };
`);


const buildStartScopeTemplate = template(`
    if (%%importName%%) {
        %%importName%%.broadcastStartScope(%%filename%%, %%id%%, {
            start: {
                line: %%startLine%%,
                col: %%startColumn%%,
            },
            end: {
                line: %%endLine%%,
                col: %%endColumn%%,
            },
        });
    }
`);

const buildEndScopeTemplate = template(
    'if (%%importName%%) { %%importName%%.broadcastStopScope(%%filename%%, %%id%%) }'
);

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

const getEndScopeTemplateById = (filename: string | null, importName: Identifier, id: string) => {
    return buildEndScopeTemplate({
        filename: filename ? t.stringLiteral(filename) : t.nullLiteral(),
        importName,
        id: t.stringLiteral(id),
    });
};

let uniqId = 0;
const generateId = () => {
    uniqId++;

    return `scope_${uniqId}`;
};

const isInCurrentFunctionScope = (scopeId: number, path: NodePath<BaseNode>) => {
    const block = path.scope.block;
    const type = block.type;

    if (type === 'FunctionDeclaration' || type === 'FunctionExpression' || type === 'ArrowFunctionExpression') {
        return path.scope.uid === scopeId;
    } else {
        if (path.scope && path.scope.parent) {
            return isInCurrentFunctionScope(scopeId, path.scope.parent.path);
        } else {
            return false;
        }
    }
};

export function devToolExecutionWrapper() {
    let importName: Identifier;
    let beginWrapper;
    let endWrapper;

    const returnScopeTraverse = (id: string, body: NodePath<BaseNode>) => {
        body.traverse({
            ReturnStatement(path) {
                if (isInCurrentFunctionScope(body.scope.uid, path)) {
                    path.insertBefore(endWrapper(id));
                }
            },
        });
    };

    const functionWrapper = (path: NodePath<FunctionDeclaration | FunctionExpression>) => {
        const body = path.get('body');
        const id = generateId();

        returnScopeTraverse(id, body);

        body.unshiftContainer('body', beginWrapper(id, body.node));
        body.pushContainer('body', endWrapper(id));
    };

    const arrowFunctionWrapper = (path: NodePath<ArrowFunctionExpression>) => {
        const body = path.get('body');
        const id = generateId();

        if (body.node.type === 'BlockStatement') {
            returnScopeTraverse(id, body);

            body.unshiftContainer('body', beginWrapper(id, body.node));
            body.pushContainer('body', endWrapper(id));
        }
    };

    const expressionWrapper = (path: NodePath<ExpressionStatement>) => {
        const id = generateId();
        const expression = path.get('expression');


        if (
            expression.node && expression.node.type === 'CallExpression'
            && expression.node.callee && expression.node.callee.object
            && expression.node.callee.object.name === importName.name
        ) {
            return false;
        } else {
            path.insertBefore(beginWrapper(id, path.node));
            path.insertAfter(endWrapper(id));
        }
    };

    return {
        name: '@testring/devtool-execution-wrapper',

        visitor: {
            Program(path: NodePath<Program>, state) {
                importName = path.scope.generateUidIdentifier('$babelDevtoolExecutionWrapper');
                const importStatement = buildRequireTemplate({
                    importName,
                });

                let lastImport: NodePath<Statement> | null = null;

                path.get('body').forEach((node) => {
                    if (node.type === 'ImportDeclaration') {
                        lastImport = node;
                    }
                });


                if (lastImport) {
                    (lastImport as NodePath<ImportDeclaration>).insertAfter(importStatement);
                } else {
                    (path as any).unshiftContainer('body', importStatement);
                }

                const filename = state.file.opts.filename;

                beginWrapper = getStartScopeTemplateByNode.bind(null, filename, importName);
                endWrapper = getEndScopeTemplateById.bind(null, filename, importName);
            },
            FunctionDeclaration: functionWrapper,
            FunctionExpression: functionWrapper,
            ArrowFunctionExpression: arrowFunctionWrapper,
            ExpressionStatement: expressionWrapper,
            VariableDeclaration: expressionWrapper,
        },
    };
}
