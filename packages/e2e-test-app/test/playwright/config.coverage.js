/* eslint-disable */

// 导入统一的timeout配置
const TIMEOUTS = require('../../timeout-config.js');

module.exports = async (config) => {
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
        tests: 'packages/e2e-test-app/test/playwright/test/**/*.spec.js',
        plugins: [
            [
                'playwright-driver',
                {
                    browserName: 'chromium',
                    launchOptions: {
                        headless: !local,
                        slowMo: local ? 100 : 0,
                        args: local ? [] : ['--no-sandbox']
                    },
                    clientTimeout: local ? 0 : (config.testTimeout || TIMEOUTS.CLIENT_SESSION),
                },
            ],
            ['babel', babelConfig],
        ],
    };
};
