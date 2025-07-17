# Extension Packages

The `packages/` directory contains extension packages and plugins for the testring testing framework, providing additional functionality and integration capabilities. These packages are primarily used for browser drivers, web application testing, development tools, and other feature extensions.

[![npm](https://img.shields.io/npm/v/@testring/plugin-selenium-driver.svg)](https://www.npmjs.com/package/@testring/plugin-selenium-driver)
[![npm](https://img.shields.io/npm/v/@testring/plugin-playwright-driver.svg)](https://www.npmjs.com/package/@testring/plugin-playwright-driver)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The extension packages provide specialized functionality that extends the core testring framework capabilities:

- **🌐 Browser Automation** - Multiple browser driver support (Selenium, Playwright)
- **🔧 Development Tools** - Comprehensive debugging and monitoring tools
- **📡 Network Communication** - WebSocket and HTTP communication support
- **📁 File Management** - File upload, download, and storage capabilities
- **⚡ Modern Build Support** - ES6+ syntax transformation and modern tooling
- **🧪 Testing Utilities** - Specialized testing tools and helpers

## Directory Structure

### Browser Driver Packages
- **`plugin-selenium-driver/`** - Selenium WebDriver plugin supporting multiple browser automation
- **`plugin-playwright-driver/`** - Playwright driver plugin for modern browser automation
- **`browser-proxy/`** - Browser proxy service providing communication bridge between browsers and test framework

### Web Application Testing Packages
- **`web-application/`** - Web application testing package providing specialized web testing functionality
- **`element-path/`** - Element path locator providing precise DOM element location capabilities
- **`e2e-test-app/`** - End-to-end test application containing complete test cases and examples

### Development Tool Packages
- **`devtool-frontend/`** - Development tool frontend providing test debugging and monitoring interface
- **`devtool-backend/`** - Development tool backend providing backend services for development tools
- **`devtool-extension/`** - Development tool extension in browser extension format

### Network and Communication Packages
- **`client-ws-transport/`** - WebSocket transport client supporting WebSocket communication
- **`http-api/`** - HTTP API package providing HTTP interface support

### File and Storage Packages
- **`plugin-fs-store/`** - File system storage plugin providing file storage functionality
- **`download-collector-crx/`** - Download collector Chrome extension for collecting browser download files

### Build and Utility Packages
- **`plugin-babel/`** - Babel plugin supporting ES6+ syntax transformation
- **`test-utils/`** - Test utilities package providing testing-related utility functions

## Key Features

### 🌐 Multi-Browser Support
Support for multiple browser drivers including both traditional Selenium WebDriver and modern Playwright automation.

### 🔧 Comprehensive Development Tools
Complete development and debugging toolchain with frontend interface, backend services, and browser extensions.

### 📡 Flexible Network Communication
Multiple network communication methods including WebSocket and HTTP API support.

### 📁 Advanced File Handling
File upload, download, and storage functionality with Chrome extension integration.

### ⚡ Modern JavaScript Support
Support for modern JavaScript syntax and build tools through Babel integration.

### 🧪 Rich Testing Utilities
Comprehensive testing utilities and helper functions for enhanced test development.

## Package Categories

### 🚗 Driver Plugins
- **`plugin-selenium-driver`** - Traditional Selenium WebDriver for cross-browser compatibility
- **`plugin-playwright-driver`** - Modern Playwright driver for fast, reliable automation

### 🔧 Functional Plugins
- **`plugin-babel`** - Code transformation plugin for ES6+ syntax support
- **`plugin-fs-store`** - File system storage plugin for persistent data management

### 🛠️ Utility Packages
- **`browser-proxy`** - Browser proxy for communication bridging
- **`element-path`** - Element locator for precise DOM targeting
- **`test-utils`** - Testing utilities and helper functions
- **`http-api`** - HTTP interface support and API utilities

### 🔍 Development Tools
- **`devtool-frontend`** - Frontend interface for test monitoring and debugging
- **`devtool-backend`** - Backend services for development tool infrastructure
- **`devtool-extension`** - Browser extension for in-browser debugging

### 📱 Applications and Examples
- **`web-application`** - Web application testing framework
- **`e2e-test-app`** - End-to-end testing examples and sample applications

## Installation and Usage

These packages can be installed independently via npm or used as plugins within the testring framework. Each package has independent version management and release cycles.

### Installation Examples

```bash
# Install Selenium driver plugin
npm install @testring/plugin-selenium-driver

# Install Playwright driver plugin
npm install @testring/plugin-playwright-driver

# Install Web application testing package
npm install @testring/web-application

# Install Babel plugin for ES6+ support
npm install @testring/plugin-babel

# Install development tools
npm install @testring/devtool-frontend @testring/devtool-backend
```

### Plugin Configuration

#### Basic Configuration (.testringrc)
```json
{
  "plugins": [
    "@testring/plugin-selenium-driver",
    "@testring/plugin-babel"
  ],
  "selenium": {
    "browsers": ["chrome", "firefox"]
  }
}
```

#### Advanced Configuration with Playwright
```json
{
  "plugins": [
    "@testring/plugin-playwright-driver",
    "@testring/plugin-fs-store"
  ],
  "playwright": {
    "browsers": ["chromium", "firefox", "webkit"],
    "headless": true
  }
}
```

#### Development Tools Configuration
```json
{
  "plugins": [
    "@testring/plugin-selenium-driver",
    "@testring/devtool-backend"
  ],
  "devtool": {
    "enabled": true,
    "port": 8080
  }
}
```

## Development and Extension

### Creating New Packages

To develop new plugins or extension packages, follow the existing package structure and development standards:

#### Standard Package Structure
```
package-name/
├── src/
│   ├── index.ts          # Main entry point
│   ├── interfaces/       # TypeScript interfaces
│   ├── services/         # Core services
│   └── utils/           # Utility functions
├── test/
│   └── *.spec.ts        # Test files
├── dist/                # Compiled output
├── package.json         # Package configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.build.json  # Build configuration
└── README.md           # Package documentation
```

#### Development Guidelines

1. **Follow TypeScript standards** - All packages must include proper type definitions
2. **Implement plugin interface** - Use the standard plugin API for framework integration
3. **Include comprehensive tests** - Unit and integration tests are required
4. **Document APIs** - Provide clear documentation and usage examples
5. **Version compatibility** - Ensure compatibility with core framework versions

### Plugin Development API

```typescript
import { PluginAPI } from '@testring/plugin-api';

export class MyPlugin {
    constructor(private api: PluginAPI) {}

    async init() {
        // Plugin initialization logic
    }

    async beforeTest() {
        // Pre-test hooks
    }

    async afterTest() {
        // Post-test hooks
    }
}
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards and testing requirements
4. Submit a pull request with detailed description

Each package follows unified project structure and development standards, making it easy to understand, maintain, and extend the framework capabilities.