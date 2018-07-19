import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';
import generate from 'babel-generator';

const template = require('babel-template');

export function generateCode({cursor, code, event}): any {
    const ast = babylon.parse(code);
    //const isAsync: boolean;

    traverse(ast, {
        enter(path) {
            if (path.node.loc && isEqualPosition(path.node.loc.end, cursor)) {
                path.insertAfter(
                    makeNode(event)
                );
                path.skip();
            }
        }
    });

    const output = generate(ast);

    return {
        code: output.code,
        cursor: {
            line: cursor.line + 1,
            column: cursor.column
        }
    };
}

function isEqualPosition(end, cursor) {
    return end.line === cursor.line && end.column === cursor.column;
}


function makeNode(event): any {
    //TODO function should return node depends on event type
    const newPath = [
        {
            id: 'api'
        },
        {
            id: 'application'
        },
        {
            id: 'root'
        },
        ...event.payload.elementPath
    ];
    const node = template(`
        api.application.click(ELEMENT_SELECTOR)
    `)(
        {
            ELEMENT_SELECTOR: createSelector(newPath)
        }
    );
    if (t.isCallExpression(node.expression)) {
        const asyncNode = t.expressionStatement(t.awaitExpression(node.expression));

        return asyncNode;
    }
    return node;
}

function createSelector(path) {
    const element = path.pop();
    if (path.length > 1) {
        return t.memberExpression(
            createSelector(path),
            t.identifier(element.id)
        );
    }
    return t.memberExpression(
        t.identifier(path[0].id),
        t.identifier(element.id)
    );
}

//
// function wrapInAsync(code) {
//
// }
