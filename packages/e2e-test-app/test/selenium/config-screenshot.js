const seleniumConfig = require('./config');

module.exports = async (config) => {
    const defConfig = await seleniumConfig(config);

    const screenshotPath = './screenshots';

    return {
        ...defConfig,
        screenshotPath,
        screenshots: 'enable',
        tests: 'test/selenium/test-screenshots/*.spec.js',
        plugins: [...defConfig.plugins,
            ...[
                'fs-storage',
                {
                    staticPaths: {
                        screenshot: screenshotPath,
                    },
                },
            ],
        ],
    };
};
