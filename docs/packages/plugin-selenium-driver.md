# @testring/plugin-selenium-driver

Selenium WebDriver plugin for the testring framework that provides comprehensive browser automation testing capabilities. This plugin integrates Selenium WebDriver to deliver robust, cross-browser testing functionality with extensive element interaction and debugging features.

[![npm version](https://badge.fury.io/js/@testring/plugin-selenium-driver.svg)](https://www.npmjs.com/package/@testring/plugin-selenium-driver)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The Selenium WebDriver plugin integrates the industry-standard Selenium WebDriver with testring, providing:

- **Multi-browser support** (Chrome, Firefox, Safari, Edge) with consistent APIs
- **Automated browser operations** for comprehensive web application testing
- **Element location and interaction** with robust selector strategies
- **Page navigation and management** including windows, frames, and tabs
- **Screenshot and debugging capabilities** for test analysis and troubleshooting

## Key Features

### 🌐 Browser Support
- **Chrome** - Most widely used testing browser with extensive debugging tools
- **Firefox** - Cross-platform support with Gecko engine
- **Safari** - macOS native browser for Apple ecosystem testing
- **Edge** - Modern Windows browser with Chromium engine
- **Headless mode** - Background execution for CI/CD environments

### 🎯 Element Operations
- Advanced element finding and location strategies
- Click, input, and selection operations with smart waiting
- Mouse and keyboard event simulation
- Drag-and-drop and touch operation support

### 📱 Page Management
- Page navigation and URL handling
- Window and tab management for multi-context testing
- Frame and popup handling for complex applications
- Intelligent waiting and synchronization mechanisms

### 🔧 Testing Infrastructure
- Selenium Grid support for distributed testing
- Docker integration for containerized environments
- Performance monitoring and network capture
- Comprehensive error handling and debugging tools

## Installation

```bash
# Using npm
npm install --save-dev @testring/plugin-selenium-driver

# Using yarn
yarn add --dev @testring/plugin-selenium-driver

# Using pnpm
pnpm add --save-dev @testring/plugin-selenium-driver
```

### WebDriver Dependencies

Install the corresponding WebDriver for your target browsers:

```bash
# Chrome WebDriver
npm install --save-dev chromedriver

# Firefox WebDriver (GeckoDriver)
npm install --save-dev geckodriver

# Safari WebDriver (macOS only)
# Enable Safari Developer options in System Preferences

# Microsoft Edge WebDriver
npm install --save-dev edgedriver

# Or install all drivers
npm install --save-dev chromedriver geckodriver edgedriver
```

### Alternative Installation Methods

```bash
# Using WebDriver Manager (recommended)
npm install --save-dev webdriver-manager
npx webdriver-manager update

# Using Selenium Standalone
npm install --save-dev selenium-standalone
npx selenium-standalone install
```

## Configuration

### Basic Configuration

Configure the plugin in your testring configuration file:

```javascript
// testring.config.js
module.exports = {
  plugins: [
    ["@testring/plugin-selenium-driver", {
      browser: "chrome",
      headless: true,
      windowSize: "1920x1080"
    }]
  ]
};
```

Or using JSON configuration in `.testringrc`:

```json
{
  "plugins": [
    ["@testring/plugin-selenium-driver", {
      "browser": "chrome",
      "headless": true,
      "windowSize": "1920x1080"
    }]
  ]
}
```

### Complete Configuration Options

```javascript
// testring.config.js
module.exports = {
  plugins: [
    ["@testring/plugin-selenium-driver", {
      // Browser selection
      browser: "chrome",  // "chrome", "firefox", "safari", "edge"

      // Browser window settings
      headless: false,
      windowSize: "1920x1080",

      // Selenium Grid configuration
      seleniumHub: "http://localhost:4444/wd/hub",

      // WebDriver capabilities
      capabilities: {
        browserName: "chrome",
        browserVersion: "latest",
        platformName: "linux",
        "goog:loggingPrefs": { browser: "ALL" }
      },

      // Browser-specific options
      chromeOptions: {
        args: [
          "--disable-web-security",
          "--allow-running-insecure-content",
          "--disable-dev-shm-usage",
          "--no-sandbox"
        ],
        prefs: {
          "download.default_directory": "/tmp/downloads"
        }
      },

      // Firefox-specific options
      firefoxOptions: {
        args: ["-headless"],
        prefs: {
          "network.http.phishy-userpass-length": 255
        },
        log: { level: "trace" }
      },

      // Safari-specific options
      safariOptions: {
        technologyPreview: false
      },

      // Edge-specific options
      edgeOptions: {
        args: ["--inprivate"]
      },

      // Timeouts (milliseconds)
      implicitTimeout: 5000,
      pageLoadTimeout: 30000,
      scriptTimeout: 10000
    }]
  ]
};
```

### Environment-Specific Configuration

```javascript
// testring.config.js
const isCI = process.env.CI === 'true';

module.exports = {
  plugins: [
    ["@testring/plugin-selenium-driver", {
      browser: process.env.BROWSER || "chrome",
      headless: isCI ? true : false,
      windowSize: isCI ? "1366x768" : "1920x1080",
      seleniumHub: process.env.SELENIUM_HUB,
      chromeOptions: {
        args: [
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--no-sandbox",
          ...(isCI ? ["--headless"] : [])
        ]
      }
    }]
  ]
};
```

## Usage

### Basic Usage
```javascript
// Test file
describe('Login Test', () => {
  it('should be able to login successfully', async () => {
    // Navigate to login page
    await browser.url('https://example.com/login');

    // Enter username and password
    await browser.setValue('#username', 'testuser');
    await browser.setValue('#password', 'testpass');

    // Click login button
    await browser.click('#login-button');

    // Verify login success
    const welcomeText = await browser.getText('#welcome');
    expect(welcomeText).toContain('Welcome');
  });
});
```

### Element Location
```javascript
// Multiple location methods
await browser.click('#button-id');                    // ID
await browser.click('.button-class');                 // Class
await browser.click('button[type="submit"]');         // CSS selector
await browser.click('//button[@type="submit"]');      // XPath
await browser.click('=Submit');                       // Text content
await browser.click('*=Submit');                      // Partial text
```

### Page Operations
```javascript
// Page navigation
await browser.url('https://example.com');
await browser.back();
await browser.forward();
await browser.refresh();

// Window operations
await browser.newWindow('https://example.com');
await browser.switchWindow('window-name');
await browser.closeWindow();

// Frame operations
await browser.switchToFrame('#frame-id');
await browser.switchToParentFrame();
```

### Waiting Mechanisms
```javascript
// Wait for element to appear
await browser.waitForVisible('#element', 5000);

// Wait for element to disappear
await browser.waitForHidden('#loading', 10000);

// Wait for text content
await browser.waitForText('#status', 'Complete', 5000);

// Wait for value change
await browser.waitForValue('#input', 'expected-value', 3000);

// Custom wait condition
await browser.waitUntil(() => {
  return browser.isVisible('#submit-button');
}, 5000, 'Submit button did not appear');
```

### Form Operations
```javascript
// Input field operations
await browser.setValue('#input', 'test value');
await browser.addValue('#input', ' additional');
await browser.clearValue('#input');

// Select box operations
await browser.selectByVisibleText('#select', 'Option 1');
await browser.selectByValue('#select', 'option1');
await browser.selectByIndex('#select', 0);

// Checkboxes and radio buttons
await browser.click('#checkbox');
await browser.click('#radio');

// File upload
await browser.chooseFile('#file-input', './test-file.txt');
```

### Assertions and Verification
```javascript
// Element existence
const isVisible = await browser.isVisible('#element');
expect(isVisible).toBe(true);

// Text content
const text = await browser.getText('#element');
expect(text).toBe('Expected Text');

// Attribute values
const value = await browser.getValue('#input');
expect(value).toBe('expected-value');

// Element attributes
const className = await browser.getAttribute('#element', 'class');
expect(className).toContain('active');
```

## Advanced Features

### Multi-Browser Testing
```javascript
// Configure multiple browsers
const browsers = ['chrome', 'firefox', 'safari'];

browsers.forEach(browserName => {
  describe(`${browserName} Tests`, () => {
    beforeEach(async () => {
      await browser.switchBrowser(browserName);
    });

    it('should work properly in all browsers', async () => {
      await browser.url('https://example.com');
      // Test logic
    });
  });
});
```

### Screenshot Features
```javascript
// Full page screenshot
await browser.saveScreenshot('./screenshots/full-page.png');

// Element screenshot
await browser.saveElementScreenshot('#element', './screenshots/element.png');

// Automatic screenshot on failure
afterEach(async function() {
  if (this.currentTest.state === 'failed') {
    await browser.saveScreenshot(`./screenshots/failed-${this.currentTest.title}.png`);
  }
});
```

### Performance Monitoring
```javascript
// Page load time
const startTime = Date.now();
await browser.url('https://example.com');
const loadTime = Date.now() - startTime;
console.log(`Page load time: ${loadTime}ms`);

// Network request monitoring
await browser.setupNetworkCapture();
await browser.url('https://example.com');
const networkLogs = await browser.getNetworkLogs();
```

## Debugging Features

### Debug Mode
```javascript
// Enable debug mode
await browser.debug();

// Pause execution
await browser.pause(3000);

// Console logs
const logs = await browser.getLogs('browser');
console.log('Browser logs:', logs);
```

### Element Inspection
```javascript
// Get element information
const element = await browser.$('#element');
const location = await element.getLocation();
const size = await element.getSize();
const tagName = await element.getTagName();

console.log('Element location:', location);
console.log('Element size:', size);
console.log('Element tag:', tagName);
```

## Selenium Grid Support

### Configure Selenium Grid
```json
{
  "plugins": [
    ["@testring/plugin-selenium-driver", {
      "seleniumHub": "http://selenium-hub:4444/wd/hub",
      "capabilities": {
        "browserName": "chrome",
        "browserVersion": "latest",
        "platformName": "linux"
      }
    }]
  ]
}
```

### Docker Support
```yaml
# docker-compose.yml
version: '3'
services:
  selenium-hub:
    image: selenium/hub:latest
    ports:
      - "4444:4444"

  chrome:
    image: selenium/node-chrome:latest
    depends_on:
      - selenium-hub
    environment:
      - HUB_HOST=selenium-hub
```

## Troubleshooting

### Common Issues
1. **Browser driver mismatch**
   - Ensure ChromeDriver version matches Chrome version
   - Use `chromedriver --version` to check version

2. **Element location failure**
   - Use `browser.debug()` for debugging
   - Check if element is in a frame
   - Wait for element to load completely

3. **Timeout issues**
   - Increase wait time
   - Use explicit waits instead of implicit waits
   - Check network connection

### Performance Optimization
```javascript
// Optimized configuration
{
  "chromeOptions": {
    "args": [
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-extensions"
    ]
  }
}
```

## Configuration Options Reference

### Main Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `browser` | string | `"chrome"` | Browser to use: `"chrome"`, `"firefox"`, `"safari"`, `"edge"` |
| `headless` | boolean | `false` | Run browser in headless mode |
| `windowSize` | string | `"1024x768"` | Browser window size (format: "WIDTHxHEIGHT") |
| `seleniumHub` | string | `null` | Selenium Grid Hub URL |
| `capabilities` | object | `{}` | WebDriver capabilities |
| `implicitTimeout` | number | `5000` | Implicit wait timeout in milliseconds |
| `pageLoadTimeout` | number | `30000` | Page load timeout in milliseconds |
| `scriptTimeout` | number | `10000` | Script execution timeout in milliseconds |

### Browser-Specific Options

#### Chrome Options (`chromeOptions`)

| Option | Type | Description |
|--------|------|-------------|
| `args` | string[] | Chrome command line arguments |
| `binary` | string | Path to Chrome executable |
| `extensions` | string[] | Chrome extensions to load |
| `prefs` | object | Chrome preferences |
| `debuggerAddress` | string | Chrome debugger address |

#### Firefox Options (`firefoxOptions`)

| Option | Type | Description |
|--------|------|-------------|
| `args` | string[] | Firefox command line arguments |
| `binary` | string | Path to Firefox executable |
| `prefs` | object | Firefox preferences |
| `profile` | string | Firefox profile path |
| `log` | object | Logging configuration |

#### Safari Options (`safariOptions`)

| Option | Type | Description |
|--------|------|-------------|
| `technologyPreview` | boolean | Use Safari Technology Preview |
| `cleanSession` | boolean | Start with clean session |

#### Edge Options (`edgeOptions`)

| Option | Type | Description |
|--------|------|-------------|
| `args` | string[] | Edge command line arguments |
| `binary` | string | Path to Edge executable |
| `extensions` | string[] | Edge extensions to load |
| `prefs` | object | Edge preferences |

## API Reference

The plugin provides the standard testring web application API. Key methods include:

### Navigation Methods
- `browser.url(url)` - Navigate to URL
- `browser.back()` - Navigate back
- `browser.forward()` - Navigate forward
- `browser.refresh()` - Refresh page
- `browser.getTitle()` - Get page title
- `browser.getUrl()` - Get current URL

### Element Interaction
- `browser.click(selector)` - Click element
- `browser.setValue(selector, value)` - Set input value
- `browser.getText(selector)` - Get element text
- `browser.getAttribute(selector, attribute)` - Get element attribute
- `browser.isVisible(selector)` - Check if element is visible
- `browser.waitForVisible(selector, timeout)` - Wait for element to be visible

### Window Management
- `browser.newWindow(url)` - Open new window
- `browser.switchWindow(handle)` - Switch to window
- `browser.closeWindow()` - Close current window
- `browser.getWindowHandles()` - Get all window handles

### Frame Management
- `browser.switchToFrame(selector)` - Switch to frame
- `browser.switchToParentFrame()` - Switch to parent frame

### Screenshots and Debugging
- `browser.saveScreenshot(filename)` - Save screenshot
- `browser.debug()` - Enter debug mode
- `browser.pause(milliseconds)` - Pause execution

For complete API documentation, see the [@testring/web-application](../web-application/README.md) documentation.

## Best Practices

### 1. Browser Configuration
- **Use headless mode in CI**: Set `headless: true` for continuous integration
- **Configure appropriate timeouts**: Adjust timeouts based on your application's performance
- **Use consistent window sizes**: Maintain consistent viewport across test runs
- **Optimize browser arguments**: Use performance-oriented Chrome/Firefox arguments

### 2. Element Location
- **Prefer stable selectors**: Use IDs and data attributes over CSS classes
- **Use explicit waits**: Prefer `waitForVisible()` over `pause()`
- **Handle dynamic content**: Wait for elements to be ready before interaction
- **Implement retry mechanisms**: Handle transient element location failures

### 3. Test Organization
- **Use Page Object Model**: Organize element selectors and actions in page objects
- **Implement proper cleanup**: Close windows and clear state between tests
- **Handle test isolation**: Ensure tests don't depend on each other
- **Use descriptive test names**: Make test purposes clear from names

### 4. Performance Optimization
- **Minimize browser restarts**: Reuse browser instances when possible
- **Use parallel execution**: Run tests in parallel with appropriate worker limits
- **Optimize network conditions**: Use local test environments when possible
- **Profile test execution**: Identify and optimize slow tests

### 5. Error Handling
- **Implement comprehensive error handling**: Catch and handle WebDriver exceptions
- **Use meaningful error messages**: Provide context in assertion failures
- **Capture debugging information**: Take screenshots on failures
- **Log relevant information**: Include browser logs and network activity

## Migration to Playwright

Consider migrating to the modern [@testring/plugin-playwright-driver](../plugin-playwright-driver/README.md) for:

- **Better performance** and reliability
- **Modern browser features** and APIs
- **Built-in waiting mechanisms**
- **Enhanced debugging capabilities**

Migration is straightforward with minimal code changes required.

## Troubleshooting

### Common Issues

1. **WebDriver version mismatch**:
   ```
   Error: SessionNotCreatedException: session not created
   ```
   - Update ChromeDriver to match your Chrome version
   - Use `chromedriver --version` to check version

2. **Element not found**:
   ```
   Error: NoSuchElementError: no such element
   ```
   - Use `browser.debug()` to inspect page state
   - Check if element is in a frame
   - Wait for element to load with `waitForVisible()`

3. **Timeout errors**:
   ```
   Error: TimeoutError: Timeout of 5000ms exceeded
   ```
   - Increase timeout values in configuration
   - Use explicit waits instead of implicit waits
   - Check network connectivity and page load times

4. **Selenium Grid connection issues**:
   ```
   Error: ECONNREFUSED
   ```
   - Verify Selenium Grid is running
   - Check network connectivity to Grid Hub
   - Validate Grid capabilities configuration

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Enable Selenium debug logging
DEBUG=selenium-webdriver npm test

# Enable testring debug logging
DEBUG=testring:selenium npm test
```

### Performance Optimization

```javascript
// Optimized Chrome configuration for CI
{
  chromeOptions: {
    args: [
      "--headless",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--no-sandbox",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding"
    ]
  }
}
```

## Dependencies

- **`selenium-webdriver`** - Selenium WebDriver core library
- **`@testring/plugin-api`** - Plugin API interface
- **`@testring/types`** - TypeScript type definitions
- **`@testring/utils`** - Utility functions

## Related Modules

- **`@testring/plugin-playwright-driver`** - Modern browser automation plugin
- **`@testring/browser-proxy`** - Browser proxy service
- **`@testring/element-path`** - Element location utilities
- **`@testring/web-application`** - Web application testing interface

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.