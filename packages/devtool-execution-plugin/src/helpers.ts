import {
    BaseNode,
    Function,
} from '@babel/types';
import { NodePath } from '@babel/traverse';

function getFunctionId(path: NodePath<Function>): string {
    if (path.isFunctionDeclaration()) {
        const id = path.get('id');

        if (id.node && id.node.name) {
            return id.node.name;
        }
    }

    return `{${path.node.start}:${path.node.end}}`;
}

export function getFunctionPath(path: NodePath<BaseNode>): string | null {
    let parts: NodePath<Function>[] = [];

    if (path.isFunction()) {
        parts.push(path);
    }

    let parent = path.getFunctionParent() as NodePath<Function>;

    while (parent !== null) {
        parts.push(parent);
        parent = parent.getFunctionParent();
    }

    if (parts.length === 0) {
        return null;
    }

    return parts
        .map(path => getFunctionId(path))
        .reverse()
        .join('/');
}
