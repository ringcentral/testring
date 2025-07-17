# Troubleshooting Guide

This guide helps you resolve common issues when using testring.

## Installation Issues

### Node.js Version Compatibility

**Problem:** testring fails to install or run
**Solution:** Ensure you're using Node.js 16.0 or higher

```bash
node --version  # Should show v16.0.0 or higher
npm --version   # Should show 7.0.0 or higher
```

### Permission Errors

**Problem:** Permission denied during installation
**Solution:** Use proper npm configuration or sudo (not recommended)

```bash
# Preferred: Configure npm to use a different directory
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Alternative: Use sudo (not recommended)
sudo npm install -g testring
```

### Network/Proxy Issues

**Problem:** Installation fails due to network issues
**Solution:** Configure npm proxy settings

```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
npm config set registry https://registry.npmjs.org/
```

## Configuration Issues

### Invalid Configuration File

**Problem:** testring fails to start with configuration errors
**Solution:** Validate your `.testringrc` file

```bash
# Check JSON syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('.testringrc', 'utf8')))"

# Use JavaScript config for complex setups
mv .testringrc testring.config.js
```

### Plugin Loading Errors

**Problem:** Plugins fail to load
**Solution:** Verify plugin installation and configuration

```bash
# Check if plugin is installed
npm list @testring/plugin-playwright-driver

# Reinstall if missing
npm install --save-dev @testring/plugin-playwright-driver
```

## Browser Driver Issues

### Playwright Browser Installation

**Problem:** Playwright browsers not found
**Solution:** Install browsers explicitly

```bash
npx playwright install
npx playwright install chromium  # Install specific browser
```

### Selenium WebDriver Issues

**Problem:** WebDriver executable not found
**Solution:** Install and configure drivers

```bash
# Install ChromeDriver
npm install --save-dev chromedriver

# Or use webdriver-manager
npm install -g webdriver-manager
webdriver-manager update
```

### Headless Mode Issues

**Problem:** Tests fail in headless mode but work in headed mode
**Solution:** Debug display and environment issues

```bash
# Run in headed mode for debugging
testring run --headed

# Check display environment (Linux)
export DISPLAY=:0
```

## Test Execution Issues

### Tests Timing Out

**Problem:** Tests consistently timeout
**Solution:** Increase timeout values and optimize selectors

```json
{
    "timeout": 60000,
    "retryCount": 2,
    "plugins": [
        ["@testring/plugin-playwright-driver", {
            "timeout": 30000,
            "navigationTimeout": 30000
        }]
    ]
}
```

### Element Not Found Errors

**Problem:** Elements cannot be located
**Solution:** Improve selectors and add waits

```javascript
// Bad: Immediate selection
const element = await browser.$('#my-element');

// Good: Wait for element
const element = await browser.$('#my-element');
await element.waitForDisplayed({ timeout: 5000 });

// Better: Use data attributes
const element = await browser.$('[data-test-id="my-element"]');
```

### Memory Issues

**Problem:** Tests consume too much memory
**Solution:** Optimize worker configuration

```json
{
    "workerLimit": 2,  // Reduce parallel workers
    "retryCount": 1,   // Reduce retries
    "timeout": 30000   // Reduce timeout
}
```

## Performance Issues

### Slow Test Execution

**Problem:** Tests run slowly
**Solution:** Optimize configuration and test structure

```json
{
    "workerLimit": 4,  // Increase parallel workers
    "plugins": [
        ["@testring/plugin-playwright-driver", {
            "headless": true,  // Use headless mode
            "devtools": false  // Disable devtools
        }]
    ]
}
```

### High CPU Usage

**Problem:** High CPU usage during test execution
**Solution:** Limit concurrent processes

```json
{
    "workerLimit": 2,  // Reduce from default
    "concurrency": 1   // Run tests sequentially if needed
}
```

## Debugging Tips

### Enable Debug Logging

```bash
# Enable debug output
DEBUG=testring:* testring run

# Enable specific module debugging
DEBUG=testring:worker testring run
```

### Use Browser DevTools

```javascript
// Add breakpoints in tests
await browser.debug();  // Pauses execution

// Take screenshots for debugging
await browser.saveScreenshot('./debug-screenshot.png');
```

### Inspect Test Environment

```javascript
// Log browser information
console.log('Browser:', await browser.getCapabilities());
console.log('URL:', await browser.getUrl());
console.log('Title:', await browser.getTitle());
```

## Common Error Messages

### "Cannot find module '@testring/...'"

**Cause:** Missing dependency
**Solution:** Install the required package

```bash
npm install --save-dev @testring/plugin-playwright-driver
```

### "Port already in use"

**Cause:** Another process is using the required port
**Solution:** Kill the process or use a different port

```bash
# Find process using port 8080
lsof -ti:8080

# Kill the process
kill -9 $(lsof -ti:8080)

# Or configure different port
testring run --port 8081
```

### "Browser process crashed"

**Cause:** Browser instability or resource issues
**Solution:** Reduce load and add stability measures

```json
{
    "workerLimit": 1,
    "retryCount": 3,
    "plugins": [
        ["@testring/plugin-playwright-driver", {
            "args": ["--no-sandbox", "--disable-dev-shm-usage"]
        }]
    ]
}
```

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/ringcentral/testring/issues)
2. Review the [API Documentation](../api/README.md)
3. Look at [example configurations](../packages/e2e-test-app.md)
4. Create a minimal reproduction case
5. Open a new issue with detailed information

## Useful Commands

```bash
# Check testring version
testring --version

# Validate configuration
testring run --dry-run

# Run with verbose output
testring run --verbose

# Run specific test file
testring run --tests "./test/specific.spec.js"

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```
