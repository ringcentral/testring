/// <reference types="mocha" />

import * as chai from 'chai';
import { getArguments } from '../src/arguments-parser';

describe('argument parser', () => {
    it('should correctly work without argv', () => {
        const args = getArguments(undefined as any);

        chai.expect(args).to.be.equal(null);
    });

    it('should correctly get empty arguments array', () => {
        const args = getArguments([]);

        chai.expect(args).to.be.deep.equal({});
    });

    it('should correctly parse user arguments', () => {
        const customConfigPath = './customConfig.json';
        const customTestsPath = './tests/**/*.test.js';
        const pluginsSet = ['plugin1', 'plugin2', 'plugin3'];
        const customFieldSet = ['#P0', '#P1', '#P2'];
        const argv = [
            '',
            // boolean
            '--debug',
            // value with assign
            `--config=${customConfigPath}`,
            `--plugins=${pluginsSet[0]}`,
            `--plugins=${pluginsSet[1]}`,
            `--plugins=${pluginsSet[2]}`,
            // value without assign
            '--tests',
            customTestsPath,
            '--custom-field',
            `${customFieldSet[0]},${customFieldSet[1]},${customFieldSet[2]}`,
            '--my-namespaced.custom-field',
            `${customFieldSet[0]},${customFieldSet[1]},${customFieldSet[2]}`,
            '--my-namespaced.second-custom-field',
            `${customFieldSet[0]}`
        ];

        const args = getArguments(argv);
        const expected = {
            debug: true,
            config: customConfigPath,
            tests: customTestsPath,
            plugins: pluginsSet,
            customField: customFieldSet,
            myNamespacedCustomField: customFieldSet,
            myNamespacedSecondCustomField: customFieldSet[0],
            myNamespaced: {
                customField: customFieldSet,
                secondCustomField: customFieldSet[0]
            }
        };

        chai.expect(args).to.be.deep.equal(expected);
    });
});
