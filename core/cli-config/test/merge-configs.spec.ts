/// <reference types="mocha" />

import * as chai from 'chai';
import {IConfig} from '@testring/types';
import {mergeConfigs} from '../src/merge-configs';

describe('getConfig', () => {
    it('should not be object link', () => {
        const source = {
            plugins: ['plugin1', 'plugin2'],
        };
        const config = mergeConfigs<Partial<IConfig>>(source, {
            plugins: ['plugin3'],
        });

        chai.expect(source).to.not.equal(config);
    });

    it('should not mutate the source object', () => {
        const source = {
            plugins: ['plugin1', 'plugin2'],
        };
        mergeConfigs<Partial<IConfig>>(source, {
            plugins: ['plugin3'],
        });

        chai.expect(source).to.be.deep.equal({
            plugins: ['plugin1', 'plugin2'],
        });
    });

    it('should get config with correct array of plugins (strings)', () => {
        const config = mergeConfigs<Partial<IConfig>>(
            {
                plugins: ['plugin1', 'plugin2'],
            },
            {
                plugins: ['plugin2', 'plugin3'],
            },
        );

        chai.expect(config).to.be.deep.equals({
            plugins: ['plugin1', 'plugin2', 'plugin3'],
        });
    });

    it('should get config with correct array of plugins (arrays)', () => {
        const config = mergeConfigs<Partial<IConfig>>(
            {
                plugins: [
                    'plugin2',
                    [
                        'plugin1',
                        {
                            cache: false,
                        },
                    ],
                ],
            },
            {
                plugins: [
                    [
                        'plugin1',
                        {
                            debug: true,
                        },
                    ],
                    [
                        'plugin2',
                        {
                            test: 1,
                        },
                    ],
                ],
            },
        );

        chai.expect(config).to.be.deep.equals({
            plugins: [
                [
                    'plugin2',
                    {
                        test: 1,
                    },
                ],
                [
                    'plugin1',
                    {
                        cache: false,
                        debug: true,
                    },
                ],
            ],
        });
    });

    it('should get config with correct array of plugins (string + array)', () => {
        const config = mergeConfigs<Partial<IConfig>>(
            {
                plugins: ['plugin2', 'plugin1'],
            },
            {
                plugins: [
                    [
                        'plugin1',
                        {
                            debug: true,
                        },
                    ],
                ],
            },
        );

        chai.expect(config).to.be.deep.equals({
            plugins: [
                'plugin2',
                [
                    'plugin1',
                    {
                        debug: true,
                    },
                ],
            ],
        });
    });

    it('should get config with correct array of plugins (array + undefined value)', () => {
        const config = mergeConfigs<Partial<IConfig>>(
            {
                plugins: [
                    [
                        'plugin1',
                        {
                            debug: true,
                        },
                    ],
                ],
            },
            {
                plugins: [
                    'plugin2',
                    [
                        'plugin1',
                        {
                            debug: undefined,
                        },
                    ],
                ],
            },
        );

        chai.expect(config).to.be.deep.equals({
            plugins: [
                [
                    'plugin1',
                    {
                        debug: undefined,
                    },
                ],
                'plugin2',
            ],
        });
    });

    it('should get config with correct array of plugins (array + empty array value)', () => {
        const config = mergeConfigs<Partial<IConfig>>(
            {
                plugins: [
                    [
                        'plugin1',
                        {
                            debug: true,
                        },
                    ],
                ],
            },
            {
                plugins: [
                    ['plugin2'],
                    [
                        'plugin1',
                        {
                            debug: undefined,
                        },
                    ],
                ],
            },
        );

        chai.expect(config).to.be.deep.equals({
            plugins: [
                [
                    'plugin1',
                    {
                        debug: undefined,
                    },
                ],
                ['plugin2', {}],
            ],
        });
    });

    it('should get config with correct array of plugins with array of objects config property', () => {
        const config = mergeConfigs<Partial<IConfig>>(
            {
                plugins: [
                    [
                        'plugin1',
                        {
                            property: [
                                {
                                    foo: 'bar',
                                },
                            ],
                        },
                    ],
                ],
            },
            {
                plugins: [
                    'plugin2',
                    [
                        'plugin1',
                        {
                            property: [
                                {
                                    test: 'bar',
                                },
                            ],
                        },
                    ],
                ],
            },
        );

        chai.expect(config).to.be.deep.equals({
            plugins: [
                [
                    'plugin1',
                    {
                        property: [
                            {
                                foo: 'bar',
                            },
                            {
                                test: 'bar',
                            },
                        ],
                    },
                ],
                'plugin2',
            ],
        });
    });

    it('should get config with correct test array property with array of objects in correct order', () => {
        const config = mergeConfigs<{test: any[]}>(
            {
                test: [
                    [
                        'plugin1',
                        {
                            property: [
                                {
                                    foo: 'bar',
                                },
                            ],
                        },
                    ],
                ],
            },
            {
                test: [
                    'plugin2',
                    [
                        'plugin1',
                        {
                            property: [
                                {
                                    test: 'bar',
                                },
                            ],
                        },
                    ],
                ],
            },
        );

        chai.expect(config).to.be.deep.equals({
            test: [
                [
                    'plugin1',
                    {
                        property: [
                            {
                                foo: 'bar',
                            },
                        ],
                    },
                ],
                'plugin2',
                [
                    'plugin1',
                    {
                        property: [
                            {
                                test: 'bar',
                            },
                        ],
                    },
                ],
            ],
        });
    });
});
