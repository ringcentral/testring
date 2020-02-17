module.exports = async (config) =>  ({
    workerLimit: 5,
    retryCount: 0,
    testTimeout: config.devtool ? 0 : config.testTimeout,
    tests: 'test/selenium/test/*.spec.js',
    plugins: [
        ['selenium-driver', {
            clientTimeout: config.devtool ? 0 : config.testTimeout,
            recorderExtension: config.devtool,
            desiredCapabilities: config.devtool ? {} : {
                chromeOptions: {
                    args: ['--headless', '--disable-gpu', '--no-sandbox'],
                },
            },
        }],
        ['babel', {
            presets: [
                'es2015',
            ],
        }],
    ],
});
