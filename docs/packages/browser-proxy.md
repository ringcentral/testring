# @testring/browser-proxy

Browser proxy service that provides a communication bridge between the main test process and browser plugins. This module spawns independent Node.js child processes and communicates with the main framework through `@testring/transport`.

[![npm version](https://badge.fury.io/js/@testring/browser-proxy.svg)](https://www.npmjs.com/package/@testring/browser-proxy)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The browser proxy acts as an intermediary layer between the testring framework and browser automation plugins, enabling:

- **Process Isolation** - Runs browser operations in separate processes to reduce main process load
- **Plugin Management** - Manages browser plugin lifecycles and configurations
- **Message Forwarding** - Provides reliable message routing between processes
- **Multi-Instance Support** - Supports multiple proxy instances for different plugins
- **Debug Support** - Enables debugging mode for development and troubleshooting

## Key Features

### 🔄 Process Management
- Spawns and manages independent Node.js child processes for browser operations
- Handles process lifecycle including startup, execution, and cleanup
- Supports both local and remote worker configurations

### 📡 Communication Bridge
- Provides reliable message forwarding between main process and browser plugins
- Implements command-response pattern for synchronous operations
- Supports asynchronous event broadcasting

### 🔌 Plugin Integration
- Seamless integration with browser automation plugins (Selenium, Playwright)
- Dynamic plugin loading and configuration
- Standardized plugin interface for consistent behavior

### 🛠️ Development Support
- Debug mode for enhanced development experience
- Comprehensive logging and error handling
- Worker pool management for optimal resource utilization

## Installation

```bash
# Using npm
npm install --save-dev @testring/browser-proxy

# Using yarn
yarn add @testring/browser-proxy --dev

# Using pnpm
pnpm add @testring/browser-proxy --dev
```

## Basic Usage

### Creating a Browser Proxy Controller

```typescript
import { browserProxyControllerFactory } from '@testring/browser-proxy';
import { transport } from '@testring/transport';

// Create controller instance
const controller = browserProxyControllerFactory(transport);

// Initialize the controller
await controller.init();
```

### Plugin Registration

```typescript
import { BrowserProxyAPI } from '@testring/plugin-api';

// In your plugin
class MyBrowserPlugin {
    constructor(api: BrowserProxyAPI) {
        // Register browser proxy plugin
        api.proxyPlugin('./path/to/browser-plugin', {
            workerLimit: 2,
            debug: false
        });
    }
}
```

### Executing Browser Commands

```typescript
import { BrowserProxyActions } from '@testring/types';

// Execute browser commands through the proxy
const result = await controller.execute('test-session-1', {
    action: BrowserProxyActions.click,
    args: ['#submit-button', { timeout: 5000 }]
});

// Navigate to URL
await controller.execute('test-session-1', {
    action: BrowserProxyActions.url,
    args: ['https://example.com']
});

// Wait for element
await controller.execute('test-session-1', {
    action: BrowserProxyActions.waitForExist,
    args: ['#loading-indicator', 10000]
});
```

## Configuration

### Worker Configuration

```typescript
interface IBrowserProxyWorkerConfig {
    plugin: string;           // Plugin path or name
    config: {
        workerLimit?: number | 'local';  // Number of workers or 'local' mode
        debug?: boolean;                 // Enable debug mode
        timeout?: number;                // Command timeout in milliseconds
        retries?: number;                // Number of retry attempts
    };
}
```

### Debug Mode

```typescript
const controller = browserProxyControllerFactory(transport);

// Enable debug mode for detailed logging
await controller.init();

// Execute with debug information
const result = await controller.execute('debug-session', {
    action: BrowserProxyActions.click,
    args: ['#debug-button']
});
```

## Advanced Usage

### Custom Plugin Implementation

```typescript
import { IBrowserProxyPlugin } from '@testring/types';

class CustomBrowserPlugin implements IBrowserProxyPlugin {
    async click(applicant: string, selector: string, options?: any): Promise<any> {
        // Custom click implementation
        console.log(`Clicking ${selector} for ${applicant}`);
        // ... browser automation logic
        return { success: true };
    }

    async url(applicant: string, url: string): Promise<any> {
        // Custom navigation implementation
        console.log(`Navigating to ${url} for ${applicant}`);
        // ... navigation logic
        return { currentUrl: url };
    }

    async waitForExist(applicant: string, selector: string, timeout: number): Promise<any> {
        // Custom wait implementation
        console.log(`Waiting for ${selector} (timeout: ${timeout}ms)`);
        // ... wait logic
        return { found: true };
    }

    async end(applicant: string): Promise<any> {
        // Cleanup for specific session
        console.log(`Ending session for ${applicant}`);
        return { ended: true };
    }

    kill(): void {
        // Global cleanup
        console.log('Killing browser plugin');
    }
}

// Export plugin factory
module.exports = (config: any) => new CustomBrowserPlugin();
```

### Worker Pool Management

```typescript
// Configure worker pool
const controller = browserProxyControllerFactory(transport);

// Set worker limit
await controller.init(); // Uses plugin configuration

// Execute commands across multiple workers
const promises = [
    controller.execute('session-1', { action: BrowserProxyActions.url, args: ['https://site1.com'] }),
    controller.execute('session-2', { action: BrowserProxyActions.url, args: ['https://site2.com'] }),
    controller.execute('session-3', { action: BrowserProxyActions.url, args: ['https://site3.com'] })
];

const results = await Promise.all(promises);
```

## API Reference

### BrowserProxyController

#### Methods

- **`init(): Promise<void>`** - Initialize the controller and load plugins
- **`execute(applicant: string, command: IBrowserProxyCommand): Promise<any>`** - Execute browser command
- **`kill(): Promise<void>`** - Terminate all workers and cleanup resources

### browserProxyControllerFactory

Factory function that creates a new `BrowserProxyController` instance.

```typescript
function browserProxyControllerFactory(transport: ITransport): BrowserProxyController
```

## Integration with Testing Frameworks

### With Selenium Driver

```typescript
// In your test configuration
{
  "plugins": [
    "@testring/plugin-selenium-driver"
  ],
  "selenium": {
    "browsers": ["chrome"],
    "workerLimit": 2
  }
}
```

### With Playwright Driver

```typescript
// In your test configuration
{
  "plugins": [
    "@testring/plugin-playwright-driver"
  ],
  "playwright": {
    "browsers": ["chromium"],
    "workerLimit": 3
  }
}
```

## Error Handling

```typescript
try {
    const result = await controller.execute('test-session', {
        action: BrowserProxyActions.click,
        args: ['#non-existent-element']
    });
} catch (error) {
    console.error('Browser command failed:', error);
    // Handle error appropriately
}
```

## Troubleshooting

### Common Issues

1. **Plugin Loading Errors**
   - Ensure plugin path is correct
   - Verify plugin exports a factory function
   - Check plugin dependencies are installed

2. **Worker Spawn Failures**
   - Check Node.js version compatibility
   - Verify sufficient system resources
   - Review debug logs for detailed error information

3. **Communication Timeouts**
   - Increase timeout values in configuration
   - Check network connectivity for remote workers
   - Monitor system resource usage

### Debug Logging

Enable debug mode for detailed logging:

```typescript
const controller = browserProxyControllerFactory(transport);
// Debug information will be logged automatically when debug: true in config
```

## Dependencies

- `@testring/child-process` - Child process management
- `@testring/logger` - Logging functionality
- `@testring/pluggable-module` - Plugin architecture
- `@testring/transport` - Inter-process communication
- `@testring/types` - TypeScript type definitions
- `@testring/utils` - Utility functions

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.