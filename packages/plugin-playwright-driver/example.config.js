// Example configuration for using @testring/plugin-playwright-driver

module.exports = {
    plugins: [
        // Basic configuration - using Chromium in headless mode
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            contextOptions: {
                viewport: { width: 1280, height: 720 }
            }
        }],
        
        // Advanced configuration with debugging features
        /*
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium', // or 'firefox', 'webkit'
            launchOptions: {
                headless: false,
                slowMo: 100, // Slow down operations for debugging
                devtools: true
            },
            contextOptions: {
                viewport: { width: 1920, height: 1080 },
                locale: 'en-US',
                timezoneId: 'America/New_York'
            },
            // Enable debugging features
            coverage: true, // Enable code coverage
            video: true,    // Record video of tests
            videoDir: './test-results/videos',
            trace: true,    // Record execution trace
            traceDir: './test-results/traces',
            // Timeout settings
            clientTimeout: 15 * 60 * 1000, // 15 minutes
            clientCheckInterval: 5 * 1000   // 5 seconds
        }]
        */
    ],
    
    // Test files
    tests: './**/*.spec.js',
    
    // Other testring configuration...
};