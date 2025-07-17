// Example configuration for migrating from Selenium to Playwright
// This shows all Selenium-compatible parameters and their Playwright equivalents

module.exports = {
    plugins: [
        // Configuration using deprecated Selenium parameters
        // These will work but will show warning logs
        ['@testring/plugin-playwright-driver', {
            // Selenium-style parameters (will show warnings)
            host: 'localhost',                  // ⚠️ Deprecated: use seleniumGrid.gridUrl
            hostname: 'selenium-hub.local',     // ⚠️ Deprecated: use seleniumGrid.gridUrl
            port: 4444,                         // ⚠️ Deprecated: include in seleniumGrid.gridUrl
            cdpCoverage: true,                  // ⚠️ Deprecated: use coverage
            chromeDriverPath: '/path/to/driver', // ⚠️ Will be ignored
            recorderExtension: true,            // ⚠️ Will be ignored
            logLevel: 'debug',                  // ⚠️ Deprecated: use DEBUG env variable
            
            // WebDriverIO-style capabilities
            capabilities: {                     // ⚠️ Deprecated: use browserName, launchOptions
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['--headless', '--no-sandbox']
                }
            },
            
            // Alternative: desiredCapabilities array
            desiredCapabilities: [{             // ⚠️ Deprecated: use browserName, launchOptions
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['--headless=new']
                }
            }],
            
            // Common parameters (work in both plugins)
            clientTimeout: 15 * 60 * 1000,
            clientCheckInterval: 5000,
            disableClientPing: false,
            delayAfterSessionClose: 1000,
            workerLimit: 'local'
        }],
        
        // Recommended: Playwright-native configuration
        /*
        ['@testring/plugin-playwright-driver', {
            // Browser configuration
            browserName: 'chromium',  // 'chromium', 'firefox', 'webkit', 'msedge'
            
            // Launch options (replaces capabilities)
            launchOptions: {
                headless: true,
                args: ['--no-sandbox'],
                slowMo: 0,
                devtools: false
            },
            
            // Context options
            contextOptions: {
                viewport: { width: 1920, height: 1080 },
                locale: 'en-US',
                timezoneId: 'America/New_York'
            },
            
            // Coverage (replaces cdpCoverage)
            coverage: true,
            
            // Video recording
            video: true,
            videoDir: './test-results/videos',
            
            // Trace recording
            trace: true,
            traceDir: './test-results/traces',
            
            // Selenium Grid support
            seleniumGrid: {
                gridUrl: 'http://selenium-hub.local:4444/wd/hub',
                gridCapabilities: {
                    platformName: 'linux'
                },
                gridHeaders: {
                    'Authorization': 'Bearer token'
                }
            },
            
            // Common parameters (same as Selenium)
            clientTimeout: 15 * 60 * 1000,
            clientCheckInterval: 5000,
            disableClientPing: false,
            delayAfterSessionClose: 1000,
            workerLimit: 'local'
        }]
        */
    ],
    
    // Test files
    tests: './**/*.spec.js',
    
    // Other testring configuration...
};

/* 
Migration Guide:
================

When you see warnings like:
[Selenium Compatibility] Parameter 'host' is deprecated. Please use 'seleniumGrid.gridUrl' instead.

Replace:
- host/hostname/port → seleniumGrid.gridUrl
- cdpCoverage → coverage
- capabilities → browserName + launchOptions + contextOptions
- desiredCapabilities → browserName + launchOptions + contextOptions
- logLevel → DEBUG environment variable
- chromeDriverPath → Not needed (Playwright manages browsers)
- recorderExtension → Not needed

Browser name mapping:
- 'chrome' → 'chromium'
- 'firefox' → 'firefox' (same)
- 'safari' → 'webkit'
- 'edge' → 'msedge'
*/
