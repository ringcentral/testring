# Migration Guide: Selenium to Playwright

This guide helps you migrate from `@testring/plugin-selenium-driver` to `@testring/plugin-playwright-driver`.

## Why Migrate?

- **Faster execution** - Playwright starts browsers faster and executes tests more efficiently
- **Better reliability** - Built-in auto-waiting reduces flaky tests
- **Modern features** - Video recording, tracing, and better debugging tools
- **Multi-browser support** - Native support for Chrome, Firefox, and Safari
- **Better mobile testing** - Improved mobile device emulation

## Quick Migration

### 1. Install the new plugin

```bash
npm uninstall @testring/plugin-selenium-driver
npm install @testring/plugin-playwright-driver
```

### 2. Update your configuration

**Before (Selenium):**
```javascript
module.exports = {
    plugins: [
        ['@testring/plugin-selenium-driver', {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['--headless', '--no-sandbox']
                }
            },
            logLevel: 'error'
        }]
    ]
};
```

**After (Playwright):**
```javascript
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true,
                args: ['--no-sandbox']
            }
        }]
    ]
};
```

### 3. Test your migration

Most test code should work without changes. Run your existing tests to verify.

## Configuration Mapping

| Selenium | Playwright | Notes |
|----------|------------|-------|
| `capabilities.browserName: 'chrome'` | `browserName: 'chromium'` | Chromium is Chrome's open-source base |
| `capabilities.browserName: 'firefox'` | `browserName: 'firefox'` | Direct mapping |
| `capabilities['goog:chromeOptions']` | `launchOptions` | Different structure but similar options |
| `capabilities['moz:firefoxOptions']` | `launchOptions` | Firefox-specific options |
| `port`, `host` | Not needed | Playwright manages browser lifecycle |
| `logLevel` | Built-in | Playwright has better logging |

## Browser Mapping

| Selenium Browser | Playwright Browser | Notes |
|------------------|-------------------|-------|
| `chrome` | `chromium` | Same rendering engine |
| `firefox` | `firefox` | Direct mapping |
| `safari` | `webkit` | Safari's rendering engine |
| `edge` | `chromium` | Edge uses Chromium |

## Common Configuration Examples

### Headless Testing (CI)
```javascript
{
    browserName: 'chromium',
    launchOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
}
```

### Debug Mode (Local Development)
```javascript
{
    browserName: 'chromium',
    launchOptions: {
        headless: false,
        slowMo: 100,
        devtools: true
    },
    video: true,
    trace: true
}
```

### Mobile Emulation
```javascript
{
    browserName: 'chromium',
    contextOptions: {
        ...devices['iPhone 12'],
        // or custom viewport
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)...'
    }
}
```

### Multiple Browsers
```javascript
// You can configure multiple instances
{
    plugins: [
        ['@testring/plugin-playwright-driver', { browserName: 'chromium' }],
        ['@testring/plugin-playwright-driver', { browserName: 'firefox' }],
        ['@testring/plugin-playwright-driver', { browserName: 'webkit' }]
    ]
}
```

## API Compatibility

The Playwright plugin implements the same API as Selenium, so your test code should work without changes:

```javascript
// These methods work the same way
await browser.url('https://example.com');
await browser.click('#button');
await browser.setValue('#input', 'text');
await browser.getText('#element');
await browser.makeScreenshot();
```

## New Features

Playwright offers additional features not available in Selenium:

### Video Recording
```javascript
{
    video: true,
    videoDir: './test-results/videos'
}
```

### Execution Traces
```javascript
{
    trace: true,
    traceDir: './test-results/traces'
}
```

### Code Coverage
```javascript
{
    coverage: true
}
```

## Troubleshooting

### Common Issues

1. **Selectors not found**
   - Playwright has stricter element visibility rules
   - Use `waitForVisible` before interacting with elements

2. **Timing issues**
   - Playwright auto-waits, but you might need to adjust timeouts
   - Use `waitUntil` for custom conditions

3. **Different browser behavior**
   - Chromium vs Chrome might have slight differences
   - Test in your target browser for production

### Performance Tips

1. **Use headless mode** for CI environments
2. **Disable video/trace** in production tests
3. **Set appropriate timeouts** for your application
4. **Reuse browser contexts** when possible

## Getting Help

- Check the [Playwright documentation](https://playwright.dev)
- Review the plugin's README for configuration options
- Look at the example configuration in `example.config.js`

## Gradual Migration

You can migrate gradually by running both plugins side by side:

```javascript
module.exports = {
    plugins: [
        // Keep selenium for critical tests
        ['@testring/plugin-selenium-driver', { /* config */ }],
        // Add playwright for new tests
        ['@testring/plugin-playwright-driver', { /* config */ }]
    ]
};
```

Then migrate tests one by one and remove the selenium plugin when complete.