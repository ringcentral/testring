# Playwright Plugin Migration Guide

This document provides a guide for migrating from Selenium to Playwright, along with related compatibility information.

## Overview

The testring framework now supports Playwright as a browser automation driver, serving as an alternative to Selenium. The Playwright plugin provides a highly compatible API with Selenium, making the migration process as smooth as possible.

## Key Improvements

### 🔧 Resource Management
- **Improved process cleanup**: Fixed issues where Chromium processes might not terminate correctly
- **Timeout protection**: All cleanup operations have timeout protection to prevent infinite waiting
- **Force cleanup**: If normal cleanup fails, attempts to forcefully terminate related processes
- **Startup cleanup**: Automatically detects and cleans up orphaned processes from previous runs

### 🆔 Tab ID Management
- **Consistent Tab ID**: Uses WeakMap to ensure one-to-one mapping between page instances and Tab IDs
- **Navigation compatibility**: Tab ID remains unchanged after page navigation, consistent with Selenium behavior

### ⚡ Asynchronous Execution
- **executeAsync compatibility**: Full support for Selenium-style asynchronous JavaScript execution
- **Browser script support**: Supports framework built-in scripts like `getOptionsPropertyScript`
- **Callback conversion**: Automatically converts callback-style functions to Promise-style

### 🚨 Dialog Handling
- **Alert compatibility**: Consistent alert/confirm/prompt handling behavior with Selenium
- **Serialization safety**: Fixed inter-process communication issues caused by async function serialization

## Usage

### Configure Playwright Plugin

In your testring configuration file, use the `playwright-driver` plugin:

```javascript
module.exports = {
    plugins: ['playwright-driver', 'babel'],

    // Playwright specific configuration
    'playwright-driver': {
        browserName: 'chromium', // or 'firefox', 'webkit'
        launchOptions: {
            headless: true,
            args: []
        },
        contextOptions: {},
        clientTimeout: 15 * 60 * 1000,
        video: false,
        trace: false
    }
};
```

### Environment Variables

Supports the following environment variables:

- `PLAYWRIGHT_DEBUG=1`: Enable debug mode (non-headless, slow motion)

### Cleanup Zombie Processes

If you encounter situations where Chromium processes don't terminate correctly, you can use:

```bash
npm run cleanup:playwright
```

## Compatibility

### ✅ Fully Compatible Features

- All basic browser operations (click, type, navigate, etc.)
- Element finding and manipulation
- Window/tab management
- Alert/Dialog handling
- File uploads
- Screenshot functionality
- JavaScript execution
- Cookie management
- Form operations

### ⚠️ Partially Compatible Features

- **Frame operations**: Basic functionality available, but some advanced frame operations may differ
- **Mobile device emulation**: Supports basic device emulation, but may differ from Selenium implementation

### ❌ Incompatible Features

Currently no known completely incompatible features. If you encounter issues, please refer to the troubleshooting section.

## Performance Comparison

| Feature | Selenium | Playwright |
|---------|----------|------------|
| Startup Speed | Slower | Fast |
| Stability | Average | High |
| Debugging Capability | Basic | Powerful |
| Browser Support | Wide | Chrome/Firefox/Safari |
| Resource Consumption | High | Medium |

## Troubleshooting

### Process Cleanup Issues

If you find that Chromium processes don't terminate correctly:

1. Run cleanup command:
   ```bash
   npm run cleanup:playwright
   ```

2. Manually check for remaining processes:
   ```bash
   pgrep -fla "playwright.*chrom"
   ```

3. If there are still remnants, manually clean up:
   ```bash
   pkill -f "playwright.*chrom"
   ```

### Serialization Errors

If you encounter "await is only valid in async functions" errors:

1. Ensure you're using the latest version of the plugin
2. Check if async/await is being misused in callback functions
3. Restart the test process

### Tab ID Inconsistency

If you encounter Tab ID mismatch issues in tests:

1. Ensure no manual browser window operations
2. Check window switching logic in test code
3. Use `app.getCurrentTabId()` to get current Tab ID

## Best Practices

### 1. Resource Cleanup
```javascript
// Ensure cleanup after tests
afterEach(async () => {
    await app.end();
});
```

### 2. Error Handling
```javascript
try {
    await app.click(selector);
} catch (error) {
    // Log error information
    console.error('Click failed:', error.message);
    throw error;
}
```

### 3. Waiting Strategy
```javascript
// Use appropriate waiting
await app.waitForVisible(selector, 5000);
await app.click(selector);
```

### 4. Debug Mode
```javascript
// Enable debug mode during development
if (process.env.NODE_ENV === 'development') {
    process.env.PLAYWRIGHT_DEBUG = '1';
}
```

## Migration Checklist

- [ ] Update configuration file to use `playwright-driver`
- [ ] Test basic browser operations
- [ ] Verify Alert/Dialog handling
- [ ] Check window/tab management
- [ ] Test file upload functionality
- [ ] Verify asynchronous JavaScript execution
- [ ] Run complete test suite
- [ ] Check if process cleanup works properly

## Support

If you encounter issues during migration, please:

1. Consult the troubleshooting section of this document
2. Check GitHub Issues
3. Run `npm run cleanup:playwright` to clean up possible remaining processes
4. Provide detailed error information and reproduction steps

## Version History

- **v0.8.1**: Enhanced resource management
  - Automatic cleanup of orphaned processes at startup
  - Improved process lifecycle management
  - Stronger cleanup mechanisms
- **v0.8.0**: Initial Playwright plugin release
  - Basic browser operation support
  - Tab ID management system
  - Process cleanup improvements
  - executeAsync compatibility