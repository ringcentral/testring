/// <reference types="mocha" />

import * as chai from 'chai';
import { mergeConfigs } from '../src/merge-configs';

describe('getConfig', () => {
    it('should get correct config after merge', () => {
        const config = mergeConfigs([{
            plugins: ['plugin1', 'plugin2']
        },
            {
                plugins: ['plugin1', 'plugin3']
            }]);
        chai.expect(config).to.be.deep.equals({
            plugins: ['plugin1', 'plugin2', 'plugin3']
        });
    });
    it('should get config with correct array of plugins', () => {
        const config = mergeConfigs([{
            plugins: [['plugin1', {
                cache: false
            }]]
        },
            {
                plugins: [['plugin1', {
                    debug: true
                }]]
            }]);
        chai.expect(config).to.be.deep.equals({
            plugins: [
                ['plugin1', {
                    cache: false,
                    debug: true
                }]
            ]
        });
    });
});
