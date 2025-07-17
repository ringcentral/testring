# @testring/e2e-test-app

End-to-end test application for the testring framework that provides comprehensive test examples, mock web server, and demonstration of testing capabilities. This package serves as both a testing ground for the testring framework itself and a reference implementation for users learning how to write effective e2e tests.

[![npm version](https://badge.fury.io/js/@testring/e2e-test-app.svg)](https://www.npmjs.com/package/@testring/e2e-test-app)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The e2e-test-app is a comprehensive testing application that demonstrates the full capabilities of the testring framework, providing:

- **Complete test suite examples** for both Selenium and Playwright drivers
- **Mock web server** with static fixtures and API endpoints for testing
- **Real-world test scenarios** covering common web application testing patterns
- **Performance and timeout optimization** examples
- **Screenshot and visual testing** demonstrations
- **File upload/download testing** capabilities
- **Cross-browser testing** configurations

## Key Features

### 🧪 Comprehensive Test Examples
- Basic navigation and page interaction tests
- Form handling and input validation
- Element selection and manipulation
- Screenshot capture and comparison
- File upload and download testing
- Mock API integration testing

### 🖥️ Mock Web Server
- Express-based mock server for isolated testing
- Static HTML fixtures for consistent test scenarios
- File upload endpoint for testing file operations
- Selenium hub mock for testing grid configurations
- Configurable endpoints and responses

### 🔧 Multiple Driver Support
- Selenium WebDriver test examples
- Playwright driver test examples
- Cross-browser compatibility testing
- Headless and headed mode configurations

### ⚡ Performance Optimization
- Optimized timeout configurations for different environments
- Environment-specific timeout adjustments (local, CI, debug)
- Performance monitoring and measurement examples

## Installation

```bash
# Using npm
npm install --save-dev @testring/e2e-test-app

# Using yarn
yarn add @testring/e2e-test-app --dev

# Using pnpm
pnpm add @testring/e2e-test-app --dev
```

## Project Structure

```
e2e-test-app/
├── src/
│   ├── mock-web-server.ts      # Express mock server
│   └── test-runner.ts          # Test execution wrapper
├── test/
│   ├── playwright/             # Playwright-specific tests
│   │   ├── config.js           # Playwright configuration
│   │   ├── env.json            # Environment settings
│   │   └── test/               # Test files
│   ├── selenium/               # Selenium-specific tests
│   │   └── test/               # Test files
│   └── simple/                 # Simple test examples
│       └── .testringrc         # Basic configuration
├── static-fixtures/            # HTML test fixtures
└── [Timeout Guide](../reports/timeout-guide.md)           # Timeout optimization guide
```

## Usage

### Running Tests

The package provides several npm scripts for running different test suites:

```bash
# Run all tests
npm test

# Run simple tests with basic configuration
npm run test:simple

# Run Playwright tests
npm run test:playwright

# Run Playwright tests in headless mode
npm run test:playwright:headless

# Run screenshot tests
npm run test:screenshots
```

### Mock Web Server

The mock web server provides a controlled environment for testing:

```typescript
import { MockWebServer } from './src/mock-web-server';

const server = new MockWebServer();

// Start the server
await server.start(); // Runs on port 8080

// Server provides:
// - Static HTML fixtures at http://localhost:8080/
// - File upload endpoint at http://localhost:8080/upload
// - Mock Selenium hub at http://localhost:8080/wd/hub/*
// - Headers inspection at http://localhost:8080/selenium-headers

// Stop the server
server.stop();
```

## Test Examples

### Basic Navigation Test

```javascript
import { run } from 'testring';

run(async (api) => {
    const app = api.application;

    // Navigate to a page
    await app.url('https://captive.apple.com');

    // Verify page title
    const title = await app.getTitle();
    await app.assert.include(title, 'Success');

    // Test navigation methods
    await app.refresh();

    // Verify page content
    const pageSource = await app.getSource();
    await app.assert.include(pageSource, 'html');
});
```

### Element Interaction Test

```javascript
import { run } from 'testring';
import { getTargetUrl } from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'click.html'));

    // Click a button
    await app.click(app.root.button);

    // Verify the result
    const outputText = await app.getText(app.root.output);
    await app.assert.equal(outputText, 'success');

    // Test coordinate-based clicking
    await app.clickCoordinates(app.root.halfHoveredButton, {
        x: 'right',
        y: 'center',
    });
});
```

### Form Handling Test

```javascript
import { run } from 'testring';
import { getTargetUrl } from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    // Fill form fields
    await app.setValue(app.root.textInput, 'test value');
    await app.selectByValue(app.root.dropdown, 'option2');
    await app.click(app.root.checkbox);

    // Submit form
    await app.click(app.root.submitButton);

    // Verify form submission
    const result = await app.getText(app.root.result);
    await app.assert.include(result, 'Form submitted');
});
```

### Screenshot Testing

```javascript
import { run } from 'testring';
import { getTargetUrl } from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'visual-test.html'));

    // Take a screenshot
    const screenshot = await app.takeScreenshot();

    // Save screenshot with custom name
    await app.saveScreenshot('custom-screenshot.png');

    // Compare with baseline (if configured)
    await app.assert.visualMatch('baseline-screenshot.png');
});
```

## Configuration Examples

### Playwright Configuration

```javascript
// test/playwright/config.js
module.exports = {
    plugins: [
        '@testring/plugin-playwright-driver'
    ],
    playwright: {
        browsers: ['chromium', 'firefox', 'webkit'],
        headless: process.env.HEADLESS !== 'false',
        viewport: { width: 1280, height: 720 },
        timeout: 30000
    },
    tests: './test/playwright/test/**/*.spec.js',
    workerLimit: 2
};
```

### Environment Configuration

```json
// test/playwright/env.json
{
    "host": "http://localhost:8080",
    "timeout": {
        "default": 10000,
        "navigation": 30000,
        "element": 5000
    },
    "screenshots": {
        "enabled": true,
        "path": "./screenshots",
        "onFailure": true
    }
}
```

### Simple Test Configuration

```json
// test/simple/.testringrc
{
    "tests": "test/simple/*.spec.js",
    "plugins": ["babel"],
    "envParameters": {
        "test": 1,
        "host": "http://localhost:8080"
    },
    "workerLimit": 1,
    "retryCount": 2
}
```

## Static Test Fixtures

The package includes HTML fixtures for consistent testing:

### Basic HTML Fixture

```html
<!-- static-fixtures/basic.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Basic Test Page</title>
</head>
<body data-test-automation-id="root">
    <h1 data-test-automation-id="title">Test Page</h1>
    <button data-test-automation-id="button">Click Me</button>
    <div data-test-automation-id="output"></div>
</body>
</html>
```

### Form Testing Fixture

```html
<!-- static-fixtures/form.html -->
<!DOCTYPE html>
<html>
<body data-test-automation-id="root">
    <form data-test-automation-id="form">
        <input type="text" data-test-automation-id="textInput" />
        <select data-test-automation-id="dropdown">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
        </select>
        <input type="checkbox" data-test-automation-id="checkbox" />
        <button type="submit" data-test-automation-id="submitButton">Submit</button>
    </form>
    <div data-test-automation-id="result"></div>
</body>
</html>
```

## Timeout Optimization

The package includes comprehensive timeout optimization with environment-specific adjustments:

### Timeout Configuration

```javascript
// Example timeout configuration
const TIMEOUTS = {
    // Fast operations (< 5 seconds)
    CLICK: 2000,
    HOVER: 1000,
    FILL: 3000,
    KEY: 1000,

    // Medium operations (5-15 seconds)
    WAIT_FOR_ELEMENT: 10000,
    WAIT_FOR_VISIBLE: 10000,
    WAIT_FOR_CLICKABLE: 8000,
    CONDITION: 5000,

    // Slow operations (15-60 seconds)
    PAGE_LOAD: 30000,
    NAVIGATION: 20000,
    NETWORK_REQUEST: 15000,

    // Environment-specific adjustments
    custom: (environment, operation, baseTimeout) => {
        const multipliers = {
            local: 1.5,    // Longer timeouts for debugging
            ci: 0.8,       // Shorter timeouts for CI speed
            debug: 5.0     // Much longer for debugging
        };
        return baseTimeout * (multipliers[environment] || 1.0);
    }
};
```

### Usage in Tests

```javascript
// Using optimized timeouts
await app.click(selector, { timeout: TIMEOUTS.CLICK });
await app.waitForElement(selector, { timeout: TIMEOUTS.WAIT_FOR_ELEMENT });

// Environment-specific timeout
const customTimeout = TIMEOUTS.custom('local', 'hover', 2000);
await app.hover(selector, { timeout: customTimeout });
```

## Development and Testing

### Running the Test Suite

```bash
# Install dependencies
npm install

# Start mock server and run all tests
npm test

# Run specific test suites
npm run test:simple
npm run test:playwright
npm run test:screenshots

# Run with custom configuration
npm run test:playwright -- --config custom-config.js
```

### Adding New Tests

1. **Create test file** in the appropriate directory (`test/playwright/test/` or `test/selenium/test/`)

2. **Use the test template**:
```javascript
import { run } from 'testring';
import { getTargetUrl } from './utils';

run(async (api) => {
    const app = api.application;

    // Your test logic here
    await app.url(getTargetUrl(api, 'your-fixture.html'));
    // ... test steps
});
```

3. **Add corresponding HTML fixture** in `static-fixtures/` if needed

4. **Update configuration** if new plugins or settings are required

### Creating Custom Fixtures

```html
<!-- static-fixtures/custom-test.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Custom Test</title>
</head>
<body data-test-automation-id="root">
    <!-- Use data-test-automation-id for element identification -->
    <div data-test-automation-id="customElement">Custom Content</div>
</body>
</html>
```

## API Reference

### MockWebServer

```typescript
class MockWebServer {
    start(): Promise<void>;           // Start server on port 8080
    stop(): void;                     // Stop the server

    // Available endpoints:
    // GET  /                         - Static fixtures
    // POST /upload                   - File upload testing
    // ALL  /wd/hub/*                 - Mock Selenium hub
    // GET  /selenium-headers         - Inspect request headers
}
```

### Test Utilities

```javascript
// Available in test files
import { getTargetUrl } from './utils';

// Get URL for static fixture
const url = getTargetUrl(api, 'fixture-name.html');
// Returns: http://localhost:8080/fixture-name.html
```

## Troubleshooting

### Common Issues

1. **Mock server not starting**:
   - Check if port 8080 is available
   - Ensure all dependencies are installed
   - Verify Express server configuration

2. **Tests timing out**:
   - Review timeout configuration in [Timeout Guide](../reports/timeout-guide.md)
   - Adjust environment-specific timeouts
   - Check network connectivity to mock server

3. **Element not found errors**:
   - Verify `data-test-automation-id` attributes in fixtures
   - Check element path configuration
   - Ensure page is fully loaded before interaction

4. **Screenshot tests failing**:
   - Verify screenshot directory exists
   - Check viewport and browser settings
   - Ensure consistent rendering environment

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Run with debug output
DEBUG=true npm run test:playwright

# Run with Playwright debug mode
PLAYWRIGHT_DEBUG=1 npm run test:playwright

# Run with extended timeouts for debugging
NODE_ENV=development npm run test:playwright
```

## Dependencies

- **`testring`** - Main testing framework
- **`@testring/cli`** - Command-line interface
- **`@testring/plugin-playwright-driver`** - Playwright integration
- **`@testring/plugin-babel`** - Babel transformation
- **`@testring/web-application`** - Web testing utilities
- **`express`** - Mock web server
- **`multer`** - File upload handling
- **`concurrently`** - Parallel process execution

## Related Modules

- **`@testring/web-application`** - Core web testing functionality
- **`@testring/plugin-selenium-driver`** - Selenium WebDriver integration
- **`@testring/plugin-playwright-driver`** - Playwright integration
- **`@testring/element-path`** - Element location utilities

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.