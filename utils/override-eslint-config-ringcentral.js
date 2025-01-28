const ringcentralConfig = require('eslint-config-ringcentral');

ringcentralConfig.plugins = ringcentralConfig.plugins.filter(
    // removing import plugin cause it's already defined in eslint-config-react-app
    (plugin) => plugin !== 'import',
);

module.exports = ringcentralConfig;
