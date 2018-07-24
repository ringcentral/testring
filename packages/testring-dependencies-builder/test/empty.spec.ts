/// <reference types="mocha" />
/// <reference types="node" />

import { fileReaderFactory, fileResolverFactory } from '@testring/test-utils';
import { buildDependencyGraph, buildDependencyDictionary } from '../src';

const fixtureReader = fileReaderFactory(__dirname, './fixtures');
const fixtureResolver = fileResolverFactory(__dirname, './fixtures');

describe('buildDependencyGraph', () => {
    it('should find require', async () => {
        const indexPath = await fixtureResolver('index.js');
        const indexContent = await fixtureReader('index.js');

        const file = {
            content: indexContent,
            path: indexPath
        };

        const tree = await buildDependencyGraph(file, (filePath) => fixtureReader(filePath));
        const dict = await buildDependencyDictionary(file, (filePath) => fixtureReader(filePath));

        console.log(tree);
        console.log('------------');
        console.log(JSON.stringify(dict, void 0, 4));
    });
});
