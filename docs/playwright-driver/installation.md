# 🚀 Automatic Browser Installation Guide

## Overview

Starting from v0.8.0, `@testring/plugin-playwright-driver` supports automatic installation of all required browsers during `npm install`, eliminating the need for manual execution of additional commands.

## 🎯 Quick Start

### Default Installation (Recommended)

```bash
npm install @testring/plugin-playwright-driver
```

This will automatically install the following browsers:
- ✅ Chromium (Chrome)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Microsoft Edge

### Skip Browser Installation

If you don't want to automatically install browsers:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install @testring/plugin-playwright-driver
```

### Install Specific Browsers

Install only the browsers you need:

```bash
PLAYWRIGHT_BROWSERS=chromium,msedge npm install @testring/plugin-playwright-driver
```

## 🔧 Environment Variable Control

| Environment Variable | Purpose | Default | Example |
|---------|------|-------|------|
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | Skip browser installation | `false` | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` |
| `PLAYWRIGHT_BROWSERS` | Specify browsers to install | `chromium,firefox,webkit,msedge` | `PLAYWRIGHT_BROWSERS=chromium,firefox` |
| `PLAYWRIGHT_INSTALL_IN_CI` | Force installation in CI | `false` | `PLAYWRIGHT_INSTALL_IN_CI=1` |

## 🔨 Manual Browser Management

If you need to manually manage browsers:

```bash
# Install all browsers
npm run install-browsers

# Uninstall all browsers
npm run uninstall-browsers

# Use Playwright command to install specific browsers
npx playwright install msedge
npx playwright install firefox
npx playwright install webkit
```

## 🌐 CI/CD Environment

### GitHub Actions

```yaml
- name: Install dependencies
  run: npm install
  env:
    PLAYWRIGHT_INSTALL_IN_CI: 1  # Force browser installation in CI

# Or skip auto-install and control manually
- name: Install dependencies  
  run: npm install
  env:
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1

- name: Install specific browsers
  run: npx playwright install chromium firefox
```

### Docker

```dockerfile
# Skip automatic installation
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm install

# Manually install system dependencies and browsers
RUN npx playwright install-deps
RUN npx playwright install chromium firefox
```

## 📋 Common Scenarios

### Development Environment

```bash
# Full installation with all browsers
npm install @testring/plugin-playwright-driver
```

### Test Environment

```bash
# Install only Chromium and Firefox
PLAYWRIGHT_BROWSERS=chromium,firefox npm install @testring/plugin-playwright-driver
```

### Production Build

```bash
# Skip browser installation
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install @testring/plugin-playwright-driver
```

## 🐛 Troubleshooting

### 1. Browser Installation Failed

```bash
# Manually reinstall browsers
npm run install-browsers

# Or force reinstall
npx playwright install --force
```

### 2. Microsoft Edge Installation Issue

```bash
# Force reinstall Edge
npx playwright install --force msedge
```

### 3. Permission Issue

```bash
# Ensure script has execution permission
chmod +x node_modules/@testring/plugin-playwright-driver/scripts/install-browsers.js
```

### 4. Issues in CI Environment

```bash
# Force browser installation in CI
PLAYWRIGHT_INSTALL_IN_CI=1 npm install

# Or install system dependencies
npx playwright install-deps
```

## 📊 Verify Installation

After the installation, verify if the browsers are properly installed:

```bash
# Check installed browsers
npx playwright install --list

# Run test verification
npm test
```

## 🎨 Custom Configuration

You can set default behaviors in the project's `.npmrc` file:

```ini
# .npmrc
playwright-skip-browser-download=1
playwright-browsers=chromium,firefox
```

## 🚀 Upgrade Guide

When upgrading from an older version:

```bash
# Uninstall old browsers
npm run uninstall-browsers

# Reinstall
npm install

# Verify installation
npm run install-browsers
```

## 💡 Best Practices

1. **Development Environment**: Use default installation for full browser support
2. **CI/CD**: Choose specific browsers based on testing needs
3. **Docker**: Skip auto-installation and manually control browser installation
4. **Team Collaboration**: Use `.npmrc` to unify team settings

## 🔗 Related Links

- [Playwright Official Documentation](https://playwright.dev)
- [Browser Support List](https://playwright.dev/docs/browsers)
- [CI Environment Configuration Guide](https://playwright.dev/docs/ci)

## 📞 Support

If you encounter issues, please consult:
1. The troubleshooting section of this document
2. The project's GitHub Issues
3. Playwright Official Documentation
