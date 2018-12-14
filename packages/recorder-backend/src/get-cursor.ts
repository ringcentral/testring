import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import * as t from 'babel-types';


interface CursorPosition {
    line: number;
    column: number;
}

interface NodeLocation {
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
}

export function getCursor(code: string, currentPosition: CursorPosition): CursorPosition | null {

    const ast = babylon.parse(code);
    let wasCursorFound: any;

    traverse(ast, {
        enter(path) {
            if (isCursorHere(path.node.loc, currentPosition)) {
                wasCursorFound = path;
            }
        },
    });

    if (wasCursorFound) {
        if (t.isArrowFunctionExpression(wasCursorFound.node)) {
            const arrowExpression = wasCursorFound.findParent((parentPath) => t.isExpressionStatement(parentPath.node));

            return arrowExpression.node.loc.end;
        }

        const externalNode = wasCursorFound.findParent((parentPath) => (
            t.isBlockStatement(parentPath.parent) || t.isProgram(parentPath.parent)
        ));

        return externalNode.node.loc.end;
    }

    return null;

}

function isCursorHere(nodeLocation: NodeLocation, cursorLocation: CursorPosition) {

    const isThatLine = (
        nodeLocation.start.line <= cursorLocation.line &&
        nodeLocation.end.line >= cursorLocation.line
    );


    const isThatColumn = (
        nodeLocation.start.column <= cursorLocation.column &&
        nodeLocation.end.column >= cursorLocation.column
    );

    return isThatLine && isThatColumn;
}
