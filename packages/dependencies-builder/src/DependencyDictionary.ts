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

    public async build(file: Array<IFile> | IFile) {
        const dictionary: IDependencyDictionary<IDependencyDictionary<IDependencyDictionaryNode>> = {};
        const files: Array<IFile> = [];
        const nodesCache = {};

        if (Array.isArray(file)) {
            files.push(...file);
        } else {
            files.push(file);
        }

        files.forEach(file => {
            if (file) {
                const { path, content } = file;

                nodesCache[path] = createTreeNode(
                    path,
                    content,
                    null
                );
            }
        });

        for (let key in nodesCache) {
            const item = nodesCache[key];
            const { path, content } = item;

            item.nodes = await buildNodes(path, content, nodesCache, this.readFile);

            dictionary[key] = this.getNodeDependencies(nodesCache[key]);
        }

        return dictionary;
    }
}
