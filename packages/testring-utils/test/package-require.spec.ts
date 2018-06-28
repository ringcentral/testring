/// <reference types="node" />
/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import * as typesModuleImport from '@testring/types';
import { requirePackage } from '../src/package-require';

describe('packageRequire', () => {
    it('should resolve npm modules', () => {
        const plugin = requirePackage('@testring/types');

        chai.expect(plugin).to.be.equal(typesModuleImport);
    });

    it('should resolve local node modules', () => {
        const plugin = requirePackage(
            path.resolve(__dirname, './fixtures/node-export')
        );

        chai.expect(plugin).to.be.equal('test');
    });

    it('should resolve local node modules', () => {
        const plugin = requirePackage(
            path.resolve(__dirname, './fixtures/babel-export')
        );

        chai.expect(plugin).to.be.equal('test');
    });
});
