# @testring/plugin-playwright-driver

Modern browser automation plugin for the testring framework using Playwright. This plugin provides fast, reliable, and feature-rich browser automation capabilities with support for multiple browsers and advanced debugging features.

[![npm version](https://badge.fury.io/js/@testring/plugin-playwright-driver.svg)](https://www.npmjs.com/package/@testring/plugin-playwright-driver)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The Playwright driver plugin brings modern browser automation to testring, leveraging Playwright's powerful capabilities for reliable end-to-end testing. It provides a seamless migration path from Selenium while offering enhanced performance, stability, and debugging features.

## Key Features

### 🚀 Performance & Reliability
- **Fast execution** with optimized browser automation
- **Auto-waiting** for elements and network requests
- **Stable selectors** with built-in retry mechanisms
- **Parallel execution** support for faster test runs

### 🌐 Multi-Browser Support
- **Chromium** (Chrome, Edge) with full feature support
- **Firefox** with native automation
- **WebKit** (Safari) for cross-platform testing
- **Microsoft Edge** with dedicated support

### 🛠️ Modern Testing Features
- **Network interception** and request/response modification
- **Mobile device emulation** with touch and geolocation
- **File upload/download** handling
- **JavaScript execution** in browser context

### 🔍 Rich Debugging Capabilities
- **Video recording** of test execution
- **Trace recording** with timeline and network activity
- **Screenshot capture** at any point
- **Console log collection** and error tracking

### ☁️ Selenium Grid Integration
- **Distributed testing** with Selenium Grid support
- **Cloud provider compatibility** (BrowserStack, Sauce Labs, etc.)
- **Custom capabilities** and authentication headers

## Installation

```bash
# Using npm
npm install --save-dev @testring/plugin-playwright-driver

# Using yarn
yarn add --dev @testring/plugin-playwright-driver

# Using pnpm
pnpm add --save-dev @testring/plugin-playwright-driver
```

### 🚀 Automatic Browser Installation

**Automatic Mode**: Browsers are automatically installed during `npm install` with no additional steps required!

```bash
# Install all browsers automatically (chromium, firefox, webkit, msedge)
npm install @testring/plugin-playwright-driver

# Skip browser installation
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install @testring/plugin-playwright-driver

# Install only specific browsers
PLAYWRIGHT_BROWSERS=chromium,msedge npm install @testring/plugin-playwright-driver

# Force browser installation in CI environments
PLAYWRIGHT_INSTALL_IN_CI=1 npm install @testring/plugin-playwright-driver
```

### Manual Browser Management

If you need to manage browsers manually:

```bash
# Manually install all browsers
npm run install-browsers

# Uninstall all browsers
npm run uninstall-browsers

# Use Playwright commands to install specific browsers
npx playwright install msedge  # Microsoft Edge
npx playwright install firefox # Firefox
npx playwright install webkit  # Safari/WebKit
npx playwright install chromium # Chromium
```

### Environment Variables

Environment variables to control browser installation behavior:

| Variable | Description | Example |
|----------|-------------|---------|
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | Skip browser installation | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` |
| `PLAYWRIGHT_BROWSERS` | Specify browsers to install | `PLAYWRIGHT_BROWSERS=chromium,firefox` |
| `PLAYWRIGHT_INSTALL_IN_CI` | Force installation in CI | `PLAYWRIGHT_INSTALL_IN_CI=1` |
| `PLAYWRIGHT_BROWSERS_PATH` | Custom browser installation path | `PLAYWRIGHT_BROWSERS_PATH=/custom/path` |

## Usage

### Basic Configuration

Configure the plugin in your testring configuration file:

```javascript
// testring.config.js
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium', // 'chromium', 'firefox', 'webkit', or 'msedge'
            launchOptions: {
                headless: true,
                args: ['--no-sandbox']
            }
        }]
    ]
};
```

### Advanced Configuration

Take advantage of Playwright's rich feature set with advanced configuration:

```javascript
// testring.config.js
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            // Browser selection
            browserName: 'chromium',

            // Browser launch options
            launchOptions: {
                headless: false,
                slowMo: 100,
                devtools: true,
                args: ['--disable-web-security']
            },

            // Browser context options
            contextOptions: {
                viewport: { width: 1280, height: 720 },
                locale: 'en-US',
                timezoneId: 'America/New_York',
                permissions: ['geolocation'],
                colorScheme: 'dark',
                userAgent: 'Custom User Agent'
            },

            // Debugging features
            coverage: true,
            video: true,
            trace: true,

            // Paths for artifacts
            videoDir: './test-results/videos',
            traceDir: './test-results/traces',
            screenshotDir: './test-results/screenshots',

            // Timeouts
            clientTimeout: 60000,
            navigationTimeout: 30000
        }]
    ]
};
```

### Selenium Grid Configuration

Connect to Selenium Grid for distributed testing:

```javascript
// testring.config.js
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium', // Only 'chromium' and 'msedge' support Selenium Grid
            seleniumGrid: {
                // Grid connection details
                gridUrl: 'http://selenium-hub:4444',

                // Browser capabilities
                gridCapabilities: {
                    'browserName': 'chrome',
                    'browserVersion': 'latest',
                    'platformName': 'linux',
                    'goog:chromeOptions': {
                        'args': ['--headless', '--disable-gpu']
                    }
                },

                // Optional authentication headers
                gridHeaders: {
                    'Authorization': 'Bearer your-token'
                }
            }
        }]
    ]
};
```

You can also use environment variables for Selenium Grid configuration:

```bash
# Set Selenium Grid URL
export SELENIUM_REMOTE_URL=http://selenium-hub:4444

# Set capabilities as JSON string
export SELENIUM_REMOTE_CAPABILITIES='{"browserName":"chrome","browserVersion":"latest"}'

# Set optional headers
export SELENIUM_REMOTE_HEADERS='{"Authorization":"Bearer your-token"}'
```

### Using with .testringrc

If you prefer JSON configuration, you can use a `.testringrc` file:

```json
{
  "plugins": [
    ["@testring/plugin-playwright-driver", {
      "browserName": "chromium",
      "launchOptions": {
        "headless": true
      },
      "contextOptions": {
        "viewport": { "width": 1280, "height": 720 }
      }
    }]
  ]
}
```

## Configuration Options

### Main Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `browserName` | string | `'chromium'` | Browser to use: `'chromium'`, `'firefox'`, `'webkit'`, or `'msedge'` |
| `launchOptions` | object | `{}` | Playwright browser launch options |
| `contextOptions` | object | `{}` | Browser context options |
| `seleniumGrid` | object | `{}` | Selenium Grid configuration |
| `coverage` | boolean | `false` | Enable code coverage collection |
| `video` | boolean | `false` | Enable video recording |
| `trace` | boolean | `false` | Enable trace recording |
| `clientTimeout` | number | `900000` | Client timeout in milliseconds |
| `navigationTimeout` | number | `30000` | Navigation timeout in milliseconds |

### Launch Options

Common Playwright launch options:

| Option | Type | Description |
|--------|------|-------------|
| `headless` | boolean | Run browser in headless mode |
| `slowMo` | number | Slow down operations by specified milliseconds |
| `devtools` | boolean | Open browser devtools |
| `args` | string[] | Additional browser arguments |
| `executablePath` | string | Path to browser executable |
| `proxy` | object | Proxy configuration |

### Context Options

Browser context configuration options:

| Option | Type | Description |
|--------|------|-------------|
| `viewport` | object | Viewport size `{ width, height }` |
| `locale` | string | Browser locale (e.g., 'en-US') |
| `timezoneId` | string | Timezone ID (e.g., 'America/New_York') |
| `permissions` | string[] | Granted permissions |
| `colorScheme` | string | Color scheme: 'light', 'dark', or 'no-preference' |
| `userAgent` | string | Custom user agent string |
| `deviceScaleFactor` | number | Device scale factor |
| `isMobile` | boolean | Mobile device emulation |
| `hasTouch` | boolean | Touch events support |

### Selenium Grid Options

| Option | Type | Description |
|--------|------|-------------|
| `seleniumGrid.gridUrl` | string | Selenium Grid Hub URL |
| `seleniumGrid.gridCapabilities` | object | Browser capabilities for Selenium Grid |
| `seleniumGrid.gridHeaders` | object | Additional headers for Grid requests |

## Browser Support

### Supported Browsers

- **Chromium** - Latest stable version
  - ✅ Full feature support
  - ✅ Selenium Grid support
  - ✅ Video recording
  - ✅ Trace recording

- **Firefox** - Latest stable version
  - ✅ Full feature support
  - ❌ Selenium Grid support
  - ✅ Video recording
  - ✅ Trace recording

- **WebKit** - Safari technology preview
  - ✅ Full feature support
  - ❌ Selenium Grid support
  - ✅ Video recording
  - ✅ Trace recording

- **Microsoft Edge** - Latest stable version
  - ✅ Full feature support
  - ✅ Selenium Grid support
  - ✅ Video recording
  - ✅ Trace recording
  - ⚠️ Requires manual installation: `npx playwright install msedge`

**Note**: Selenium Grid integration is only supported with Chromium and Microsoft Edge browsers.

## Migration from Selenium

This plugin provides the same API as `@testring/plugin-selenium-driver`, making migration straightforward:

```javascript
// Before (Selenium)
module.exports = {
    plugins: [
        ['@testring/plugin-selenium-driver', {
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: ['--headless']
                }
            }
        }]
    ]
};

// After (Playwright)
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true
            }
        }]
    ]
};
```

### Migration Checklist

- [ ] Replace `@testring/plugin-selenium-driver` with `@testring/plugin-playwright-driver`
- [ ] Update browser names (`chrome` → `chromium`, `safari` → `webkit`)
- [ ] Convert `desiredCapabilities` to `launchOptions` and `contextOptions`
- [ ] Update any browser-specific configurations
- [ ] Test your existing test suite

Most existing tests should work without modification, but you may need to adjust some browser-specific configurations.

## Testing Examples

### Basic Test

```javascript
import { run } from 'testring';

run(async (api) => {
    const app = api.application;

    // Navigate to page
    await app.url('https://example.com');

    // Interact with elements
    await app.click('#login-button');
    await app.setValue('#username', 'testuser');
    await app.setValue('#password', 'password123');
    await app.click('#submit');

    // Verify results
    const title = await app.getTitle();
    await app.assert.include(title, 'Dashboard');
});
```

### Mobile Device Emulation

```javascript
// Configure mobile emulation in testring.config.js
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            contextOptions: {
                viewport: { width: 375, height: 667 },
                isMobile: true,
                hasTouch: true,
                deviceScaleFactor: 2,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            }
        }]
    ]
};
```

### Network Interception

```javascript
run(async (api) => {
    const app = api.application;

    // Intercept network requests
    await app.client.route('**/api/users', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 1, name: 'Test User' }])
        });
    });

    await app.url('https://example.com');
    // API call will be intercepted and mocked
});
```

## Debugging Features

### Video Recording

Enable video recording to capture test execution:

```javascript
// Configuration
{
    video: true,
    videoDir: './test-results/videos',
    launchOptions: {
        headless: true // Video works in both headless and headed modes
    }
}
```

Videos are automatically saved for each test with timestamps and test names.

### Trace Recording

Capture detailed execution traces:

```javascript
// Configuration
{
    trace: true,
    traceDir: './test-results/traces'
}
```

View traces using Playwright's trace viewer:

```bash
npx playwright show-trace ./test-results/traces/trace.zip
```

### Screenshots

Screenshots are available through the application API:

```javascript
run(async (api) => {
    const app = api.application;

    await app.url('https://example.com');

    // Take screenshot
    const screenshot = await app.makeScreenshot();

    // Screenshot on failure (automatic in most cases)
    try {
        await app.click('#non-existent-element');
    } catch (error) {
        await app.makeScreenshot(); // Capture failure state
        throw error;
    }
});
```

### Console Logs

Access browser console logs:

```javascript
run(async (api) => {
    const app = api.application;

    // Listen for console messages
    await app.client.on('console', msg => {
        console.log(`Browser console: ${msg.text()}`);
    });

    await app.url('https://example.com');
});
```

## Performance Optimization

### Best Practices

1. **Use headless mode in CI**:
   ```javascript
   {
       launchOptions: {
           headless: process.env.CI === 'true'
       }
   }
   ```

2. **Optimize viewport size**:
   ```javascript
   {
       contextOptions: {
           viewport: { width: 1280, height: 720 } // Standard size
       }
   }
   ```

3. **Disable unnecessary features**:
   ```javascript
   {
       coverage: false, // Only enable when needed
       video: process.env.CI !== 'true', // Disable in CI unless needed
       trace: false // Enable only for debugging
   }
   ```

4. **Use appropriate timeouts**:
   ```javascript
   {
       clientTimeout: 30000, // 30 seconds
       navigationTimeout: 15000 // 15 seconds
   }
   ```

### Parallel Execution

Configure testring for parallel test execution:

```javascript
// testring.config.js
module.exports = {
    workerLimit: 4, // Run 4 tests in parallel
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            launchOptions: {
                headless: true // Required for parallel execution
            }
        }]
    ]
};
```

## Troubleshooting

### Common Issues

1. **Browser not found**:
   ```bash
   Error: Executable doesn't exist at /path/to/browser
   ```
   Solution: Run `npx playwright install` or check browser installation

2. **Timeout errors**:
   ```bash
   Error: Timeout 30000ms exceeded
   ```
   Solution: Increase timeout values or check element selectors

3. **Selenium Grid connection issues**:
   ```bash
   Error: connect ECONNREFUSED
   ```
   Solution: Verify Grid URL and network connectivity

4. **Permission errors**:
   ```bash
   Error: Permission denied
   ```
   Solution: Check file system permissions for artifact directories

### Debug Mode

Enable debug logging:

```bash
DEBUG=testring:playwright npm test
```

### Environment Variables

Useful environment variables for debugging:

```bash
# Playwright debug mode
DEBUG=pw:api npm test

# Show browser (override headless)
HEADED=1 npm test

# Slow down execution
SLOWMO=1000 npm test
```

## API Reference

The plugin provides the same API as the standard testring web application interface. Key methods include:

- `app.url(url)` - Navigate to URL
- `app.click(selector)` - Click element
- `app.setValue(selector, value)` - Set input value
- `app.getText(selector)` - Get element text
- `app.waitForElement(selector)` - Wait for element
- `app.makeScreenshot()` - Take screenshot
- `app.assert.*` - Assertion methods

For complete API documentation, see the [@testring/web-application](../web-application/README.md) documentation.

## Dependencies

- **`playwright`** - Core Playwright library
- **`@testring/plugin-api`** - Plugin API interface
- **`@testring/types`** - TypeScript type definitions

## Related Modules

- **`@testring/plugin-selenium-driver`** - Selenium WebDriver plugin (migration source)
- **`@testring/web-application`** - Web application testing interface
- **`@testring/browser-proxy`** - Browser proxy service

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.