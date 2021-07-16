const path = require('path');
const ringcentralPreset = require('eslint-config-ringcentral-typescript');

const rcConfigPath = require.resolve('eslint-config-ringcentral');
const rcConfigReplacePath = path.resolve(
    __dirname,
    './utils/override-eslint-config-ringcentral',
);

ringcentralPreset.extends = ringcentralPreset.extends.map((item) => {
    if (item === rcConfigPath) {
        return rcConfigReplacePath;
    }
    return item;
});

module.exports = {
    ...ringcentralPreset,
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

        'ringcentral/specified-comment-with-task-id': 'off', // disabled for no purpose

        '@typescript-eslint/no-explicit-any': 'off', // TODO remove `any` type definitions
        '@typescript-eslint/explicit-module-boundary-types': 'off', // TODO add return types for functions

        'import/no-anonymous-default-export': 'off', // anonymous function is ok
        'import/no-default-export': 'off', // default export is ok when needed

        '@typescript-eslint/no-var-requires': 'off', // require is ok
        '@typescript-eslint/no-unused-expressions': 'off', // no-unused-expressions is same
    },
};
