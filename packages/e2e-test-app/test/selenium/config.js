module.exports = async (config) =>  ({
    workerLimit: 5,
    retryCount: 0,
    testTimeout: config.devtool ? 0 : config.testTimeout,
    tests: 'test/selenium/test/*.spec.js',
    plugins: [
        ['selenium-driver', {
            clientTimeout: config.devtool ? 0 : config.testTimeout,
            recorderExtension: config.devtool,
        }],
        ['babel', {
            presets: [
                'es2015',
            ],
            sourceMaps: config.devtool ? 'inline' : false,
        }],
    ],
});
