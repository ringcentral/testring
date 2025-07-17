// Example configuration demonstrating cdpCoverage compatibility
// This shows how to use the cdpCoverage parameter (compatible with Selenium plugin)

module.exports = {
    plugins: [
        // Using cdpCoverage parameter (Selenium-compatible)
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true,
                args: ['--no-sandbox']
            },
            contextOptions: {
                viewport: { width: 1920, height: 1080 }
            },
            // Use cdpCoverage instead of coverage for Selenium compatibility
            cdpCoverage: true,
            clientTimeout: 15 * 60 * 1000
        }],
        
        // Alternative: using the native 'coverage' parameter
        /*
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true,
                args: ['--no-sandbox']
            },
            contextOptions: {
                viewport: { width: 1920, height: 1080 }
            },
            // Native Playwright coverage parameter
            coverage: true,
            clientTimeout: 15 * 60 * 1000
        }]
        */
    ],
    
    // Test files
    tests: './**/*.spec.js',
    
    // Other testring configuration...
};
