/* eslint-disable */
const browsers = require('@puppeteer/browsers');
const path = require('path');

// 导入统一的timeout配置
const TIMEOUTS = require('../../timeout-config.js');

module.exports = async (config) => {
    const info = await browsers.getInstalledBrowsers({
        cacheDir: process.env['CHROME_CACHE_DIR'] || path.join(__dirname, '..', '..', 'chrome-cache'),
    });
    const chrome = info.find((item) => item.browser === 'chrome');
    const chromedriver = info.find((item) => item.browser === 'chromedriver');
    console.log('Chrome:', chrome.executablePath);
    console.log('Chromedriver:', chromedriver.executablePath);
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
        workerLimit: 'local',
        maxWriteThreadCount: 2,
        screenshots: 'disable',
        logLevel: 'verbose',
        retryCount: 0,
        testTimeout: local ? 0 : (config.testTimeout || TIMEOUTS.TEST_EXECUTION),
        tests: 'packages/e2e-test-app/test/selenium/test/**/*.spec.js',
        plugins: [
            [
                'selenium-driver',
                {
                    clientTimeout: TIMEOUTS.CLIENT_SESSION,
                    path: '/wd/hub',
                    chromeDriverPath: process.env['CHROMEDRIVER_PATH'] || chromedriver.executablePath,
                    workerLimit: 'local',
                    capabilities: local
                        ? {
                            'goog:chromeOptions': {
                                binary: process.env['CHROME_BIN'] || chrome.executablePath,
                            },
                        }
                        : {
                            'goog:chromeOptions': {
                                binary: process.env['CHROME_BIN'] || chrome.executablePath,
                                args: ['--headless=new', '--no-sandbox'],
                            },
                        },
                },
            ],
            ['babel', babelConfig],
        ],
    };
};
