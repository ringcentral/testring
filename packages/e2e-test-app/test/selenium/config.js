module.exports = async (config) =>  ({
    workerLimit: 5,
    retryCount: 0,
    testTimeout: config.recorder ? 0 : config.testTimeout,
    tests: 'test/selenium/test/*.spec.js',
    plugins: [
        ['selenium-driver', {
            clientTimeout: (config.recorder || config.debug) ? 0 : config.testTimeout,
            recorderExtension: config.recorder,
        }],
        ['babel', {
            presets: [
                'es2015',
            ],
        }],
    ],
});
