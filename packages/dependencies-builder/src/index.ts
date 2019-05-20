import {
    CallExpression,
    Identifier,
} from 'babel-types';
import {
    DependencyDict,
    DependencyFileReader,
} from '@testring/types';

import * as path from 'path';
import { parse } from 'babylon';
import traverse, { NodePath } from 'babel-traverse';
import { resolveAbsolutePath } from './absolute-path-resolver';
import { IMPORT_PATH } from '@testring/devtool-execution-wrapper';


const NODE_MODULES_DIRS: string[] = [];
// Collecting all node_modules dirs for process.cwd()
process.cwd().split(path.sep).forEach((part, i, pathArr) => {
    NODE_MODULES_DIRS.push(path.join('/', ...pathArr.slice(0, i + 1), 'node_modules'));
});
// Collecting all paths defined in require.main.paths
(require.main || { paths: [] }).paths.forEach((importPath) => {
    if (!NODE_MODULES_DIRS.includes(importPath)) {
        NODE_MODULES_DIRS.push(importPath);
    }
});
// Excluding env passed paths
(require.resolve.paths(__filename) || []).forEach((importPath) => {
    if (!NODE_MODULES_DIRS.includes(importPath)) {
        NODE_MODULES_DIRS.push(importPath);
    }
});
// Exclude dependency builder
NODE_MODULES_DIRS.push(IMPORT_PATH);


function getDependencies(content: string): Array<string> {
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

function isInternalDependency(absolutePath: string) {
    return require.resolve.paths(absolutePath) === null
        || NODE_MODULES_DIRS.findIndex((dir) => absolutePath.startsWith(dir)) > -1;
}

export async function buildDependencyDictionary(
    absolutePath: string,
    readFile: DependencyFileReader,
    dependenciesCache: DependencyDict = {},
): Promise<DependencyDict> {
    const dependencyNode = {
        ...(await readFile(absolutePath)),
        dependencies: {},
    };

    const resultDict: DependencyDict = {
        [absolutePath]: dependencyNode,
    };

    const dependencies = getDependencies(dependencyNode.transpiledSource);

    for (let dependency of dependencies) {
        const dependencyAbsolutePath = resolveAbsolutePath(dependency, absolutePath);
        const isInternal = isInternalDependency(dependencyAbsolutePath);

        if (!isInternal) {
            dependencyNode.dependencies[dependency] = dependencyAbsolutePath;
        }

        if (!dependenciesCache[dependencyAbsolutePath] && !isInternal) {
            Object.assign(resultDict, await buildDependencyDictionary(
                dependencyAbsolutePath,
                readFile,
                resultDict,
            ));
        }
    }

    return resultDict;
}

export async function mergeDependencyDict(...dependenciesDict: DependencyDict[]): Promise<DependencyDict> {
    return Object.assign({}, ...dependenciesDict);
}

export async function buildDependencyDictionaryFromFile(
    file: {
        transpiledSource: string;
        source: string;
        path: string;
    },
    readFile: DependencyFileReader
): Promise<DependencyDict> {
    const dependencies: { [key: string]: string } = {};
    const dependenciesMap = getDependencies(file.transpiledSource).reduce((memo: Map<string, string>, dependency) => {
        const absolutePath = resolveAbsolutePath(dependency, file.path);

        if (!isInternalDependency(absolutePath)) {
            memo.set(dependency, absolutePath);
            dependencies[dependency] = absolutePath;
        }

        return memo;
    }, new Map());

    let resultDict = {
        [file.path]: {
            source: file.source,
            transpiledSource: file.transpiledSource,
            dependencies,
        },
    };

    for (let [, dependencyAbsolutePath] of dependenciesMap) {
        resultDict = await mergeDependencyDict(
            resultDict,
            (await buildDependencyDictionary(dependencyAbsolutePath, readFile, resultDict)),
        );
    }

    return resultDict;
}

