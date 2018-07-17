import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';
import generate from 'babel-generator';

const fs = require('fs');
export function generateCode({cursor, code, event}): any {
    const ast = babylon.parse(code);
    traverse(ast, {
        enter(path) {
            console.log(path.node.loc);
            if (path.node.loc && isEqualPosition(path.node.loc.end, cursor)) {
                path.insertAfter(
                    makeNode(event)
                );
                path.skip();
            }
        }
    });
    console.log(ast);
    const output = generate(ast);
    fs.writeFile('./example.js', output.code, (err) => {
        console.log(err);
    });
    return {
        code: output.code
    };
}

function isEqualPosition(end, cursor) {
    return end.line === cursor.line && end.column === cursor.column;
}


function makeNode(event): any {
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
    return t.expressionStatement(
        t.awaitExpression(
            t.callExpression(
                t.memberExpression(
                    t.memberExpression(
                        t.identifier('api'),
                        t.identifier('application')
                    ),
                    t.identifier('click')
                ),
                [createSelector(newPath)]
            )
        )
    );
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
