/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import * as typesModuleImport from '@testring/types';
import {requirePlugin} from '../src/plugin-require';

describe('requirePlugin', () => {
    it('should resolve npm modules', () => {
        const plugin = requirePlugin('@testring/types');

        chai.expect(plugin).to.be.equal(typesModuleImport);
    });

    it('should resolve local node modules', () => {
        const plugin = requirePlugin(
            path.resolve(__dirname, './fixtures/node-export'),
        );

        chai.expect(plugin).to.be.equal('test');
    });

    it('should resolve local node modules', () => {
        const plugin = requirePlugin(
            path.resolve(__dirname, './fixtures/babel-export'),
        );

        chai.expect(plugin).to.be.equal('test');
    });
});
