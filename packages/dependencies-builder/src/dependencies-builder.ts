import {NodePath} from 'babel-traverse';
import traverse from 'babel-traverse';
import {parse} from 'babylon';
import {CallExpression, Identifier} from 'babel-types';
import {
    IDependenciesBuilder,
    IDependencyDictionary,
    IDependencyDictionaryNode,
    IDependencyTreeNode,
    DependencyFileReader,
    IFile,
} from '@testring/types';

import {resolveAbsolutePath} from './absolute-path-resolver';

type DependencyDict = IDependencyDictionary<IDependencyDictionary<IDependencyDictionaryNode>>;

export class DependenciesBuilder implements IDependenciesBuilder {
    constructor(
        private readFile: DependencyFileReader,
    ) {}

    private dictionary: DependencyDict = {};

    private createTreeNode(
        path: string,
        content: string,
        nodes: IDependencyDictionary<IDependencyTreeNode> | null
    ): IDependencyTreeNode {
        return {
            content,
            path,
            nodes
        };
    }

    private createDictionaryNode(path: string, content: string): IDependencyDictionaryNode {
        return {
            content,
            path
        };
    }

    private mergeDependencyDictionaries(newDict: DependencyDict): void {
        this.dictionary = {
            ...this.dictionary,
            ...newDict,
        };
    }

    private getDependencies(absolutePath: string, content: string): Array<string> {
        const requests: Array<string> = [];

        const sourceAST = parse(content, {
            sourceType: 'module',
            sourceFilename: content,
            plugins: [
                'estree'
            ]
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
            }
        });

        return requests;
    }

    private async buildNodes(
        parentPath: string,
        parentContent: string,
        nodesCache: IDependencyDictionary<IDependencyTreeNode>,
    ): Promise<IDependencyTreeNode['nodes']> {
        const dependencies = this.getDependencies(parentPath, parentContent);

        if (dependencies.length === 0) {
            return null;
        }

        const resultNodes: IDependencyTreeNode['nodes'] = {};

        let dependency: string;
        let node: IDependencyTreeNode;
        for (let index = 0; index < dependencies.length; index++) {
            dependency = dependencies[index];

            const dependencyAbsolutePath = resolveAbsolutePath(dependency, parentPath);

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

            const fileContent = await this.readFile(dependencyAbsolutePath);

            node = this.createTreeNode(
                dependencyAbsolutePath,
                fileContent,
                null
            );

            // Putting nodes to cache BEFORE resolving it's dependencies, fixes circular dependencies case
            nodesCache[dependencyAbsolutePath] = node;
            resultNodes[dependency] = node;

            node.nodes = await this.buildNodes(dependencyAbsolutePath, fileContent, nodesCache);
        }

        return resultNodes;
    }

    public async addToDictionary(file: IFile): Promise<void> {
        const dictionary: DependencyDict = {};
        const tree: IDependencyTreeNode = this.createTreeNode(
            file.path,
            file.content,
            null
        );

        const nodesCache = {
            [file.path]: tree
        };

        tree.nodes = await this.buildNodes(file.path, file.content, nodesCache);

        const getNodeDependencies = (node: IDependencyTreeNode) => {
            const nodes = {};

            if (node.nodes === null) {
                return nodes;
            }

            for (let request in node.nodes) {
                nodes[request] = this.createDictionaryNode(
                    node.nodes[request].path,
                    node.nodes[request].content
                );
            }

            return nodes;
        };

        for (let key in nodesCache) {
            dictionary[key] = getNodeDependencies(nodesCache[key]);
        }

        this.mergeDependencyDictionaries(dictionary);
    }

    public getDictionary() {
        return this.dictionary;
    }
}
