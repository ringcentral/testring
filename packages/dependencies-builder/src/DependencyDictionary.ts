import { PluggableModule } from '@testring/pluggable-module';
import {
    IFile,
    DependencyFileReader,
    IDependencyBuilder,
    IDependencyDictionary,
    IDependencyDictionaryNode,
    IDependencyTreeNode
} from '@testring/types';

import {
    createTreeNode,
    buildNodes,
    createDictionaryNode,
} from './methods';

export class DependencyDictionary extends PluggableModule implements IDependencyBuilder {
    constructor(
        private readFile: DependencyFileReader,
    ) {
        super([]);
    }

    private getNodeDependencies(node: IDependencyTreeNode) {
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

    public async build(file: IFile) {
        const dictionary: IDependencyDictionary<IDependencyDictionary<IDependencyDictionaryNode>> = {};

        const tree: IDependencyTreeNode = createTreeNode(
            file.path,
            file.content,
            null
        );

        const nodesCache = {
            [file.path]: tree
        };

        tree.nodes = await buildNodes(file.path, file.content, nodesCache, this.readFile);

        for (let key in nodesCache) {
            dictionary[key] = this.getNodeDependencies(nodesCache[key]);
        }

        return dictionary;
    }
}
