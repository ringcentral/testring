# Playwright Plugin Debug Mode

This document explains how to run the Playwright plugin tests in debug mode with visible browser windows.

## Debug Mode Features

When `PLAYWRIGHT_DEBUG=1` is set, the plugin will:
- Run browsers in non-headless mode (visible windows)
- Add 500ms slow motion for better visibility of actions
- Use extended timeouts (30 seconds instead of 8 seconds)

## Usage

### Method 1: Direct command (Recommended)

From the plugin directory:
```bash
cd packages/plugin-playwright-driver
PLAYWRIGHT_DEBUG=1 npx mocha --config .mocharc.debug.json
```

### Method 2: Run specific tests

```bash
cd packages/plugin-playwright-driver
PLAYWRIGHT_DEBUG=1 npx mocha --config .mocharc.debug.json --grep "should support modern browser features"
```

### Method 3: Using the local npm script

From the plugin directory:
```bash
cd packages/plugin-playwright-driver
npm run test:debug
```

## Configuration Files

- `.mocharc.json` - Normal mode (8s timeout, headless)
- `.mocharc.debug.json` - Debug mode (30s timeout, non-headless when PLAYWRIGHT_DEBUG=1)

## Tips for Debugging

1. **Focus on specific tests**: Use `--grep "pattern"` to run only the tests you're debugging
2. **Browser windows**: The browser windows will be visible and actions will be slowed down
3. **Extended timeouts**: Tests have 30-second timeouts in debug mode
4. **Console output**: Look for the "🐛 Playwright Debug Mode" message to confirm debug mode is active

## Example Commands

```bash
# Debug a specific test group
cd packages/plugin-playwright-driver
PLAYWRIGHT_DEBUG=1 npx mocha --config .mocharc.debug.json --grep "Playwright-Specific Features"

# Debug form interactions
PLAYWRIGHT_DEBUG=1 npx mocha --config .mocharc.debug.json --grep "form interaction"

# Debug error handling
PLAYWRIGHT_DEBUG=1 npx mocha --config .mocharc.debug.json --grep "error"
```