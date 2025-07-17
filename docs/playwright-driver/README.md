# Playwright Driver

This directory contains comprehensive documentation for the testring Playwright driver plugin.

## Overview

The Playwright driver plugin provides modern browser automation capabilities for testring, offering an alternative to the Selenium driver with improved performance and reliability.

## Documentation

### Setup and Installation
- [Installation Guide](installation.md) - Complete installation and setup instructions
- [Migration Guide](migration.md) - Migrating from Selenium to Playwright

### Development and Debugging
- [Debug Guide](debug.md) - Debugging Playwright tests
- [Selenium Grid Guide](selenium-grid-guide.md) - Using Playwright with Selenium Grid

## Key Features

- **Multi-browser Support** - Chrome, Firefox, Safari, Edge
- **Modern Web Standards** - Full support for modern web APIs
- **Improved Performance** - Faster test execution compared to Selenium
- **Better Debugging** - Enhanced debugging capabilities
- **Network Interception** - Built-in network request/response interception

## Quick Start

```bash
# Install the plugin
npm install --save-dev @testring/plugin-playwright-driver

# Configure in your testring config
module.exports = {
    plugins: [
        ['@testring/plugin-playwright-driver', {
            browser: 'chromium',
            headless: true
        }]
    ]
};
```

## Quick Links

- [Main Package Documentation](../packages/plugin-playwright-driver.md)
- [Plugin Development Guide](../guides/plugin-development.md)
- [Configuration Reference](../configuration/README.md)
