import type {CallExpression, Identifier} from 'babel-types';
import {parse} from 'babylon';
import traverse, {NodePath} from 'babel-traverse';
import {
    IFile,
    IDependencyDictionary,
    IDependencyDictionaryNode,
    IDependencyTreeNode,
    DependencyDict,
    DependencyFileReader,
} from '@testring/types';
import {resolveAbsolutePath} from './absolute-path-resolver';
import * as path from 'node:path';

function getDependencies(_: string, content: string): Array<string> {
    const requests: Array<string> = [];

    const sourceAST = parse(content, {
        sourceType: 'module',
        sourceFilename: content,
        plugins: ['estree'],
    });

    traverse(sourceAST, {
        CallExpression(nodePath: NodePath<CallExpression>) {
            const callee = nodePath.get('callee') as NodePath<Identifier>;

            if (callee.node.name !== 'require') {
                return;
            }

            const args = nodePath.get('arguments');
            const firstArgument = args[0];
            if (!firstArgument) {
                return;
            }

            const dependencyPath: NodePath<string> = firstArgument.get(
                'value',
            ) as never;

            requests.push(dependencyPath.node);
        },
    });

    return requests;
}

function createTreeNode(
    nodePath: string,
    content: string,
    nodes: IDependencyDictionary<IDependencyTreeNode> | null,
): IDependencyTreeNode {
    return {
        content,
        path: nodePath,
        nodes,
    };
}

function createDictionaryNode(
    nodePath: string,
    content: string,
): IDependencyDictionaryNode {
    return {
        content,
        path: nodePath,
    };
}

async function buildNodes(
    parentPath: string,
    parentContent: string,
    nodesCache: IDependencyDictionary<IDependencyTreeNode>,
    readFile: DependencyFileReader,
): Promise<IDependencyTreeNode['nodes']> {
    const dependencies = getDependencies(parentPath, parentContent);

    if (dependencies.length === 0) {
        return null;
    }

    const resultNodes: IDependencyTreeNode['nodes'] = {};

    let dependency: string | undefined;
    let node: IDependencyTreeNode;
    for (let index = 0; index < dependencies.length; index++) {
        dependency = dependencies[index];

        if (!dependency) {
            continue;
        }

        const dependencyAbsolutePath = resolveAbsolutePath(
            dependency,
            parentPath,
        );

        // Ignoring node modules
        if (require.resolve.paths(dependencyAbsolutePath) === null) {
            continue;
        }

        // Making link for already existing node
        if (nodesCache[dependencyAbsolutePath]) {
            resultNodes[dependency] = nodesCache[dependencyAbsolutePath];
            continue;
        }

        // Do not bundle node_modules, only user dependencies
        if (
            dependencyAbsolutePath.includes('node_modules') ||
            // Fix for local e2e tests running (lerna makes symlink and resolver eats it as path for real file)
            // require 'node_modules/testring' = require 'packages/testring/dist'
            dependencyAbsolutePath.includes(path.join('testring', 'dist'))
        ) {
            continue;
        }

        const fileContent = await readFile(dependencyAbsolutePath);

        node = createTreeNode(dependencyAbsolutePath, fileContent, null);

        // Putting nodes to cache BEFORE resolving it's dependencies, fixes circular dependencies case
        nodesCache[dependencyAbsolutePath] = node;
        resultNodes[dependency] = node;

        node.nodes = await buildNodes(
            dependencyAbsolutePath,
            fileContent,
            nodesCache,
            readFile,
        );
    }

    return resultNodes;
}

function getNodeDependencies(node: IDependencyTreeNode) {
    const nodes = {} as Record<string, IDependencyDictionaryNode>;

    if (node.nodes === null) {
        return nodes;
    }

    for (const request in node.nodes) {
        if (!node.nodes[request]) {
            continue;
        }
        nodes[request] = createDictionaryNode(
            node.nodes[request].path,
            node.nodes[request].content,
        );
    }

    return nodes;
}

export async function buildDependencyDictionary(
    file: IFile,
    readFile: DependencyFileReader,
): Promise<DependencyDict> {
    const dictionary: DependencyDict = {};

    const tree: IDependencyTreeNode = createTreeNode(
        file.path,
        file.content,
        null,
    );

    const nodesCache = {
        [file.path]: tree,
    };

    tree.nodes = await buildNodes(
        file.path,
        file.content,
        nodesCache,
        readFile,
    );

    for (const key in nodesCache) {
        if (nodesCache[key]) {
            dictionary[key] = getNodeDependencies(nodesCache[key]);
        }
    }

    return dictionary;
}

export async function mergeDependencyDictionaries(
    dict1: DependencyDict,
    dict2: DependencyDict,
): Promise<DependencyDict> {
    return {
        ...dict1,
        ...dict2,
    };
}
