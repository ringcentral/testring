module.exports = async (config) => {
    const devtool = config.debug || config.devtool;

    return {
        devtool,
        screenshotPath: './_tmp/',
        workerLimit: devtool ? 'local' : 5,
        maxWriteThreadCount: 2,
        screenshots: 'disable',
        retryCount: 0,
        testTimeout: devtool ? 0 : config.testTimeout,
        tests: 'test/selenium/test/*.spec.js',
        plugins: [
            [
                'selenium-driver',
                {
                    clientTimeout: devtool ? 0 : config.testTimeout,
                    recorderExtension: devtool,
                    capabilities: devtool
                        ? {}
                        : {
                              'goog:chromeOptions': {
                                  args: [
                                      '--headless',
                                      '--disable-gpu',
                                      '--no-sandbox',
                                  ],
                              },
                          },
                },
            ],
            ['babel'],
        ],
    };
};
