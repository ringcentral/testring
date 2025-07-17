# Quick Start Guide

Get up and running with testring in just a few minutes.

## Prerequisites

Make sure you have [installed testring](installation.md) before proceeding.

## Step 1: Initialize Your Project

Create a new directory for your tests:

```bash
mkdir my-testring-tests
cd my-testring-tests
npm init -y
```

Install testring:

```bash
npm install --save-dev testring
```

## Step 2: Create Your First Test

Create a test file `test/example.spec.js`:

```javascript
// test/example.spec.js
describe('My First Test', () => {
    it('should load a webpage', async () => {
        await browser.url('https://example.com');
        
        const title = await browser.getTitle();
        expect(title).to.contain('Example');
    });
    
    it('should find an element', async () => {
        await browser.url('https://example.com');
        
        const heading = await browser.$('h1');
        const text = await heading.getText();
        expect(text).to.not.be.empty;
    });
});
```

## Step 3: Create Configuration

Create a testring configuration file `.testringrc`:

```json
{
    "tests": "./test/**/*.spec.js",
    "plugins": [
        ["@testring/plugin-playwright-driver", {
            "browser": "chromium",
            "headless": true
        }]
    ],
    "workerLimit": 2,
    "retryCount": 1,
    "timeout": 30000
}
```

## Step 4: Run Your Tests

Execute your tests:

```bash
npx testring run
```

You should see output similar to:

```
✓ My First Test should load a webpage
✓ My First Test should find an element

2 passing (1.2s)
```

## Step 5: Add More Advanced Features

### Add Babel Support

For modern JavaScript features:

```bash
npm install --save-dev @testring/plugin-babel babel-preset-env
```

Create `.babelrc`:

```json
{
    "presets": ["env"]
}
```

Update `.testringrc`:

```json
{
    "tests": "./test/**/*.spec.js",
    "plugins": [
        "@testring/plugin-babel",
        ["@testring/plugin-playwright-driver", {
            "browser": "chromium",
            "headless": true
        }]
    ]
}
```

### Add File Storage

For screenshots and artifacts:

```bash
npm install --save-dev @testring/plugin-fs-store
```

Update configuration:

```json
{
    "plugins": [
        "@testring/plugin-babel",
        "@testring/plugin-fs-store",
        ["@testring/plugin-playwright-driver", {
            "browser": "chromium",
            "headless": true
        }]
    ]
}
```

## Next Steps

- [Configuration Guide](../configuration/README.md) - Learn about all configuration options
- [API Reference](../api/README.md) - Explore the full testring API
- [Plugin Development](../guides/plugin-development.md) - Create custom plugins
- [Best Practices](../guides/testing-best-practices.md) - Learn testing best practices

## Example Projects

Check out example projects in the repository:
- [E2E Test App](../packages/e2e-test-app.md) - Complete example application
- [Plugin Examples](../packages/README.md) - Various plugin usage examples

## Need Help?

- [Troubleshooting Guide](../guides/troubleshooting.md)
- [GitHub Issues](https://github.com/ringcentral/testring/issues)
- [Documentation Index](../README.md)
