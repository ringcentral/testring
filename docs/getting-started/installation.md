# Installation Guide

This guide will help you install and set up testring for your project.

## Prerequisites

Before installing testring, ensure you have:

- **Node.js** 16.0 or higher
- **npm** 7.0 or higher (or **yarn** 1.22+)
- A supported operating system (Windows, macOS, Linux)

## Installation Methods

### Method 1: Install Complete Framework

Install the complete testring framework with all core features:

```bash
npm install --save-dev testring
```

Or using yarn:

```bash
yarn add --dev testring
```

### Method 2: Install Core Only

For minimal installations, install just the core framework:

```bash
npm install --save-dev @testring/cli @testring/api
```

### Method 3: Custom Installation

Install specific modules based on your needs:

```bash
# Core framework
npm install --save-dev @testring/cli @testring/api

# Add Playwright driver
npm install --save-dev @testring/plugin-playwright-driver

# Add Selenium driver
npm install --save-dev @testring/plugin-selenium-driver

# Add additional plugins as needed
npm install --save-dev @testring/plugin-babel @testring/plugin-fs-store
```

## Browser Driver Setup

### Playwright Driver (Recommended)

For modern browser automation with Playwright:

```bash
npm install --save-dev @testring/plugin-playwright-driver
npx playwright install
```

See the [Playwright Driver Installation Guide](../playwright-driver/installation.md) for detailed setup.

### Selenium Driver

For traditional Selenium WebDriver:

```bash
npm install --save-dev @testring/plugin-selenium-driver
```

You'll also need to install browser drivers separately (ChromeDriver, GeckoDriver, etc.).

## Verification

Verify your installation by running:

```bash
npx testring --version
```

You should see the testring version number displayed.

## Next Steps

1. [Quick Start Guide](quick-start.md) - Create your first test
2. [Configuration](../configuration/README.md) - Configure testring for your project
3. [API Reference](../api/README.md) - Learn the testring API

## Troubleshooting

### Common Issues

**Permission errors on macOS/Linux:**
```bash
sudo npm install -g testring
```

**Node.js version issues:**
```bash
node --version  # Should be 16.0+
npm --version   # Should be 7.0+
```

**Installation timeout:**
```bash
npm install --save-dev testring --timeout=60000
```

For more help, see the [troubleshooting guide](../guides/troubleshooting.md).
