import { parse } from 'babylon';
import { CallExpression, Identifier } from 'babel-types';
import traverse, { NodePath } from 'babel-traverse';
import {
    IFile,
    IDependencyDictionary,
    IDependencyDictionaryNode,
    IDependencyTreeNode,
    DependencyDict,
    DependencyFileReader,
} from '@testring/types';
import { resolveAbsolutePath } from './absolute-path-resolver';

function getDependencies(absolutePath: string, content: string): Array<string> {
    const requests: Array<string> = [];

    const sourceAST = parse(content, {
        sourceType: 'module',
        sourceFilename: content,
        plugins: [
            'estree',
        ],
    });

    traverse(sourceAST, {

        // require('something');
        CallExpression(path: NodePath<CallExpression>) {
            const callee: NodePath<Identifier> = path.get('callee') as any;

            if (callee.node.name !== 'require') {
                return;
            }

            const args = path.get('arguments');
            const firstArgument = args[0];
            const dependencyPath: NodePath<string> = firstArgument.get('value') as any;

            requests.push(
                dependencyPath.node
            );
        },
    });

    return requests;
}


function createTreeNode(
    path: string,
    content: string,
    nodes: IDependencyDictionary<IDependencyTreeNode> | null
): IDependencyTreeNode {
    return {
        content,
        path,
        nodes,
    };
}


function createDictionaryNode(path: string, content: string): IDependencyDictionaryNode {
    return {
        content,
        path,
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

    let dependency: string;
    let node: IDependencyTreeNode;
    for (let index = 0; index < dependencies.length; index++) {
        dependency = dependencies[index];

        const dependencyAbsolutePath = resolveAbsolutePath(dependency, parentPath);

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
        // TODO check, if this hardcode can break some cases
        if (
            dependencyAbsolutePath.includes('node_modules') ||
            // Fix for local e2e tests running (lerna makes symlink and resolver eats it as path for real file)
            // require 'node_modules/testring' = require 'packages/testring/dist'
            dependencyAbsolutePath.includes('testring/dist')
        ) {
            continue;
        }

        const fileContent = await readFile(dependencyAbsolutePath);

        node = createTreeNode(
            dependencyAbsolutePath,
            fileContent,
            null
        );

        // Putting nodes to cache BEFORE resolving it's dependencies, fixes circular dependencies case
        nodesCache[dependencyAbsolutePath] = node;
        resultNodes[dependency] = node;

        node.nodes = await buildNodes(dependencyAbsolutePath, fileContent, nodesCache, readFile);
    }

    return resultNodes;
}

export async function buildDependencyGraph(
    file: IFile,
    readFile: DependencyFileReader
): Promise<IDependencyTreeNode> {
    const tree: IDependencyTreeNode = createTreeNode(
        file.path,
        file.content,
        null
    );

    const nodesCache = {
        [file.path]: tree,
    };

    tree.nodes = await buildNodes(file.path, file.content, nodesCache, readFile);

    return tree;
}


function getNodeDependencies(node: IDependencyTreeNode) {
    const nodes = {};

    if (node.nodes === null) {
        return nodes;
    }

    for (let request in node.nodes) {
        nodes[request] = createDictionaryNode(
            node.nodes[request].path,
            node.nodes[request].content
        );
    }

    return nodes;
}

export async function buildDependencyDictionary(file: IFile, readFile: DependencyFileReader) {
    const dictionary: DependencyDict = {};

    const tree: IDependencyTreeNode = createTreeNode(
        file.path,
        file.content,
        null
    );

    const nodesCache = {
        [file.path]: tree,
    };

    tree.nodes = await buildNodes(file.path, file.content, nodesCache, readFile);

    for (let key in nodesCache) {
        dictionary[key] = getNodeDependencies(nodesCache[key]);
    }

    return dictionary;
}


export async function mergeDependencyDictionaries(
    dict1: DependencyDict,
    dict2: DependencyDict
): Promise<DependencyDict> {
    return {
        ...dict1,
        ...dict2,
    };
}
