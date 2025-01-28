const path = require('path');
const ringcentralPreset = require('eslint-config-ringcentral-typescript');

const rcConfigOverridePath = path.resolve(
    __dirname,
    './utils/override-eslint-config-ringcentral',
);

ringcentralPreset.extends = ringcentralPreset.extends.map((item) => {
    if (item.includes('/eslint-config-ringcentral/')) {
        return rcConfigOverridePath;
    }
    return item;
});

ringcentralPreset.settings['import/parsers'] = {
    '@typescript-eslint/parser': ['.ts', '.tsx']
};

ringcentralPreset.settings['import/resolver'].typescript = {
    ...ringcentralPreset.settings['import/resolver'].typescript,
    project: [
        './packages/**/*/tsconfig.json',
        './core/**/*/tsconfig.json',
    ],
};

module.exports = {
    ...ringcentralPreset,
    globals: {
        chrome: 'writable',
    },
    env: {
        ...ringcentralPreset.env,
        es6: true,
    },
    settings: {
        ...ringcentralPreset.settings,
        react: {
            version: '16.7.18',
        },
    },
    rules: {
        ...ringcentralPreset.rules,

        '@typescript-eslint/no-explicit-any': 'off', // TODO remove `any` type definitions
        '@typescript-eslint/explicit-module-boundary-types': 'off', // TODO add return types for functions

        'ringcentral/specified-comment-with-task-id': 'off', // disabled for no purpose

        'import/no-anonymous-default-export': 'off', // anonymous function is ok
        'import/no-default-export': 'off', // default export is ok when needed

        '@typescript-eslint/no-var-requires': 'off', // require is ok
        '@typescript-eslint/no-unused-expressions': 'off', // no-unused-expressions is same

        '@typescript-eslint/no-unused-vars': 'off', // not working on CI,
        'import/namespace': 'warn' // Due to bugs https://github.com/import-js/eslint-plugin-import/issues/1845 https://github.com/import-js/eslint-plugin-import/issues/1883
    },
};
