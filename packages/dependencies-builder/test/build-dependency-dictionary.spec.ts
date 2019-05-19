/// <reference types="mocha" />

import * as chai from 'chai';
import { fileReaderFactory, fileResolverFactory } from '@testring/test-utils';
import { buildDependencyDictionary } from '../src';

const fixtureReader = fileReaderFactory(__dirname, './fixtures');
const fixtureResolver = fileResolverFactory(__dirname, './fixtures');

describe('buildDependencyDictionary', () => {
    it('should build correct dictionary', async () => {
        const indexPath = await fixtureResolver('index.js');

        const dictionary = await buildDependencyDictionary(indexPath, async (filePath) => {
            const source = await fixtureReader(filePath);

            return {
                source,
                transpiledSource: source,
            };
        });

        chai.expect(dictionary).to.have.all.keys(
            fixtureResolver('index.js'),
            fixtureResolver('dependency-1.js'),
            fixtureResolver('dependency-2.js'),
        );
    });
});
