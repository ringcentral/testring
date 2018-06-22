/// <reference types="node" />
/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import * as pluggableModuleImport from '@testring/pluggable-module';
import { findPlugin } from '../src/plugin-finder';

describe('pluginFinder', () => {
    it('should resolve npm modules', () => {
        const plugin = findPlugin('@testring/pluggable-module');

        chai.expect(plugin).to.be.equal(pluggableModuleImport);
    });

    it('should resolve local node modules', () => {
        const plugin = findPlugin(
            path.resolve(__dirname, './fixtures/node-export')
        );

        chai.expect(plugin).to.be.equal('test');
    });

    it('should resolve local node modules', () => {
        const plugin = findPlugin(
            path.resolve(__dirname, './fixtures/babel-export')
        );

        chai.expect(plugin).to.be.equal('test');
    });
});
