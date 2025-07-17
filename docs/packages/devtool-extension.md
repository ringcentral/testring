# @testring/devtool-extension

Browser extension component for the testring framework that provides in-browser debugging and testing capabilities. This Chrome extension integrates with the testring developer tools to enable real-time test monitoring, element highlighting, and browser interaction recording directly within web pages.

[![npm version](https://badge.fury.io/js/@testring/devtool-extension.svg)](https://www.npmjs.com/package/@testring/devtool-extension)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The devtool extension is a Chrome browser extension that serves as the bridge between web pages and the testring framework, providing:

- **Real-time element highlighting** for test development and debugging
- **Browser-side test recording** and interaction capture
- **WebSocket communication** with the devtool backend
- **Content script injection** for page manipulation and monitoring
- **CSP (Content Security Policy) handling** for secure operation
- **Extension popup interface** for quick access to developer tools

## Key Features

### 🎯 Element Highlighting
- XPath-based element selection and highlighting
- Visual feedback for test element targeting
- Dynamic highlight addition and removal
- Support for multiple highlighted elements simultaneously

### 📡 Real-time Communication
- WebSocket connection to devtool backend
- Bidirectional message passing between extension and framework
- Event-driven architecture for responsive interactions

### 🔧 Browser Integration
- Content script injection into all web pages
- Background script for persistent extension functionality
- Popup interface for quick developer tools access
- Options page for extension configuration

### 🛡️ Security Features
- Content Security Policy (CSP) management
- Secure message passing between contexts
- Permission-based browser API access

## Installation

```bash
# Using npm
npm install --save-dev @testring/devtool-extension

# Using yarn
yarn add @testring/devtool-extension --dev

# Using pnpm
pnpm add @testring/devtool-extension --dev
```

## Extension Architecture

### Core Components

#### Background Script
Persistent background process that manages extension lifecycle and communication:

```typescript
import { BackgroundChromeController } from './extension/background-chrome-controller';

// Initialize background controller
new BackgroundChromeController();
```

#### Content Script
Injected into web pages to provide element highlighting and interaction:

```typescript
import { ElementHighlightController } from './extension/element-highlight-controller';
import { BackgroundChromeClient } from './extension/chrome-transport/chrome-client';

const client = new BackgroundChromeClient();
const elementHighlightController = new ElementHighlightController(window);

// Listen for highlighting commands
window.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'ADD_XPATH_HIGHLIGHT':
      elementHighlightController.addXpathSelector(event.data.xpath);
      break;
    case 'CLEAR_HIGHLIGHTS':
      elementHighlightController.clearHighlights();
      break;
  }
});
```

#### Popup Interface
Quick access interface for developer tools:

```typescript
import { BackgroundChromeClient } from './extension/chrome-transport/chrome-client';

const client = new BackgroundChromeClient();

function renderPopup(config) {
  const iframe = document.createElement('iframe');
  iframe.src = `http://${config.host}:${config.httpPort}/popup?appId=${config.appId}`;
  document.body.appendChild(iframe);
}
```

## Usage

### Basic Setup

1. **Install the extension package**:
```bash
npm install --save-dev @testring/devtool-extension
```

2. **Build the extension**:
```bash
cd node_modules/@testring/devtool-extension
npm run build
```

3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Integration with Testring Framework

```typescript
import { DevtoolServerController } from '@testring/devtool-backend';
import { transport } from '@testring/transport';

// Create devtool server
const devtoolServer = new DevtoolServerController(transport);
await devtoolServer.init();

// Get extension configuration
const config = devtoolServer.getRuntimeConfiguration();
console.log('Extension ID:', config.extensionId);

// The extension will automatically connect to the devtool backend
// when both are running
```

### Programmatic Extension Control

```typescript
import {
  extensionId,
  absoluteExtensionPath,
  extensionCRXPath
} from '@testring/devtool-extension';

// Extension metadata
console.log('Extension ID:', extensionId);
console.log('Extension Path:', absoluteExtensionPath);
console.log('CRX File:', extensionCRXPath);

// Use with browser automation
const browser = await puppeteer.launch({
  args: [
    `--load-extension=${absoluteExtensionPath}`,
    `--disable-extensions-except=${absoluteExtensionPath}`
  ]
});
```

## Configuration

### Extension Manifest

The extension uses a standard Chrome extension manifest:

```json
{
  "manifest_version": 2,
  "name": "TestRing",
  "description": "TestRing recording extension",
  "permissions": [
    "webRequest",
    "webRequestBlocking",
    "activeTab",
    "contextMenus",
    "tabs"
  ],
  "content_scripts": [{
    "matches": ["*://*/*"],
    "js": ["content.bundle.js"]
  }],
  "background": {
    "scripts": ["background.bundle.js"],
    "persistent": true
  }
}
```

### Extension Options

Configure the extension through the options page or programmatically:

```typescript
import { IExtensionApplicationConfig } from '@testring/types';

const config: IExtensionApplicationConfig = {
  host: 'localhost',
  httpPort: 9000,
  wsPort: 9001,
  appId: 'my-test-app'
};

// Set configuration through extension messaging
chrome.runtime.sendMessage({
  type: 'SET_EXTENSION_OPTIONS',
  payload: config
});
```

## API Reference

### Extension Exports

```typescript
// Main extension metadata
export const extensionId: string;
export const extensionPath: string;
export const absoluteExtensionPath: string;
export const extensionCRXPath: string | null;
export const absoluteExtensionCRXPath: string | null;
export const reportPath: string;
```

### Message Types

```typescript
enum ExtensionPostMessageTypes {
  CLEAR_HIGHLIGHTS = 'CLEAR_HIGHLIGHTS',
  ADD_XPATH_HIGHLIGHT = 'ADD_XPATH_HIGHLIGHT',
  REMOVE_XPATH_HIGHLIGHT = 'REMOVE_XPATH_HIGHLIGHT'
}

enum ExtensionMessagingTransportTypes {
  WAIT_FOR_READY = 'WAIT_FOR_READY',
  SET_EXTENSION_OPTIONS = 'SET_EXTENSION_OPTIONS'
}
```

### Element Highlighting API

```typescript
class ElementHighlightController {
  // Add XPath-based element highlighting
  addXpathSelector(xpath: string): void;

  // Remove specific XPath highlighting
  removeXpathSelector(xpath: string): void;

  // Clear all highlights
  clearHighlights(): void;
}
```

## Development

### Building the Extension

```bash
# Development build with watch mode
npm run build:watch

# Production build
npm run build
```

### Extension Structure

```
dist/
├── background.bundle.js    # Background script
├── content.bundle.js       # Content script
├── popup.bundle.js         # Popup interface
├── options.bundle.js       # Options page
├── manifest.json          # Extension manifest
├── popup.html             # Popup HTML
├── options.html           # Options HTML
└── icon.png              # Extension icon
```

### Testing the Extension

1. **Load in Chrome**:
   ```bash
   # Build the extension
   npm run build

   # Load unpacked extension from dist/ folder
   ```

2. **Test with testring**:
   ```typescript
   import { DevtoolServerController } from '@testring/devtool-backend';

   const devtools = new DevtoolServerController(transport);
   await devtools.init();

   // Extension should automatically connect
   ```

## Integration Examples

### With Selenium WebDriver

```typescript
import { Builder } from 'selenium-webdriver';
import { absoluteExtensionPath } from '@testring/devtool-extension';

const driver = await new Builder()
  .forBrowser('chrome')
  .setChromeOptions(
    new chrome.Options()
      .addArguments(`--load-extension=${absoluteExtensionPath}`)
  )
  .build();
```

### With Playwright

```typescript
import { chromium } from 'playwright';
import { absoluteExtensionPath } from '@testring/devtool-extension';

const browser = await chromium.launchPersistentContext('', {
  args: [
    `--load-extension=${absoluteExtensionPath}`,
    `--disable-extensions-except=${absoluteExtensionPath}`
  ]
});
```

### With Puppeteer

```typescript
import puppeteer from 'puppeteer';
import { absoluteExtensionPath } from '@testring/devtool-extension';

const browser = await puppeteer.launch({
  args: [
    `--load-extension=${absoluteExtensionPath}`,
    `--disable-extensions-except=${absoluteExtensionPath}`
  ]
});
```

## Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Ensure the extension is built (`npm run build`)
   - Check Chrome developer mode is enabled
   - Verify manifest.json is valid

2. **Communication failures**:
   - Confirm devtool-backend is running
   - Check WebSocket connection settings
   - Verify extension permissions

3. **Element highlighting not working**:
   - Check content script injection
   - Verify XPath selectors are valid
   - Ensure page allows script execution

### Debug Mode

Enable debug logging in the extension:

```typescript
// In background script
console.log('Extension background loaded');

// In content script
console.log('Content script injected');

// Check extension status
chrome.management.getSelf((info) => {
  console.log('Extension info:', info);
});
```

## Dependencies

- **`@testring/client-ws-transport`** - WebSocket communication
- **`@testring/types`** - TypeScript type definitions
- **`@testring/utils`** - Utility functions
- **`chrome-launcher`** - Chrome browser automation
- **`webpack`** - Module bundling and build system

## Related Modules

- **`@testring/devtool-backend`** - Backend server for developer tools
- **`@testring/devtool-frontend`** - Frontend interface for developer tools
- **`@testring/plugin-selenium-driver`** - Selenium WebDriver integration
- **`@testring/plugin-playwright-driver`** - Playwright integration

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.