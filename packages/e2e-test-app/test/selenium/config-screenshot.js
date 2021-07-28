const seleniumConfig = require('./config');

module.exports = async (config) => {
    const defConfig = await seleniumConfig(config);

    return {
        ...defConfig,
        screenshots: 'enable',
        tests: 'test/selenium/test-screenshots/*.spec.js',
    };
};
