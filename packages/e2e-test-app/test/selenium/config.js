const browsers = require('@puppeteer/browsers');
const path = require('path');

module.exports = async (config) => {
    const info = await browsers.getInstalledBrowsers({
        cacheDir: path.join(__dirname, '..', '..', 'chrome-cache'),
    });
    const chrome = info.find((item) => item.browser === 'chrome');
    if (!chrome) {
        throw new Error('Chrome is not found');
    }
    const chromedriver = info.find((item) => item.browser === 'chromedriver');
    if (!chromedriver) {
        throw new Error('Chromedriver is not found');
    }
    const local = !config.headless;

    const babelConfig = {
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        node: 'current',
                    },
                },
            ],
        ],
    };

    if (config.debug) {
        babelConfig.presets[0][1].debug = true;
        babelConfig.sourceMaps = 'inline';
    }

    return {
        screenshotPath: './_tmp/',
        workerLimit: local ? 'local' : 5,
        maxWriteThreadCount: 2,
        screenshots: 'disable',
        retryCount: 0,
        testTimeout: local ? 0 : config.testTimeout,
        tests: 'test/selenium/test/**/shadow-click.spec.js',
        plugins: [
            [
                'selenium-driver',
                {
                    clientTimeout: local ? 0 : config.testTimeout,
                    path: '/wd/hub',
                    chromeDriverPath: chromedriver.executablePath,
                    localVersion: 'v4',
                    capabilities: local
                        ? {
                              'goog:chromeOptions': {
                                  binary: chrome.executablePath,
                              },
                              'wdio:enforceWebDriverClassic': false,
                          }
                        : {
                              'goog:chromeOptions': {
                                  binary: chrome.executablePath,
                                  args: ['--headless=new', '--no-sandbox'],
                              },
                              'wdio:enforceWebDriverClassic': false,
                          },
                },
            ],
            ['babel', babelConfig],
        ],
    };
};
