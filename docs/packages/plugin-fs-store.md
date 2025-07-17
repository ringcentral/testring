# @testring/plugin-fs-store

File system storage plugin for the testring framework that extends the file naming strategy of the `@testring/fs-store` module, making it easier to organize output directories based on worker processes or file types during test execution.

[![npm version](https://badge.fury.io/js/@testring/plugin-fs-store.svg)](https://www.npmjs.com/package/@testring/plugin-fs-store)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The `@testring/plugin-fs-store` plugin integrates with the core `@testring/fs-store` module to provide:

- **Customizable file naming strategies** for test artifacts
- **Organized output directory structure** based on file types
- **Worker-specific file organization** for parallel test execution
- **Static path mapping** for different file categories
- **Unique file name generation** to prevent conflicts

This plugin is particularly useful for managing test artifacts such as screenshots, logs, and other output files in a structured and predictable way, especially in multi-process test environments.

## Key Features

### 🗂️ File Organization
- Map different file types to specific output directories
- Create hierarchical directory structures for test artifacts
- Maintain consistent file naming conventions across test runs

### 🔄 Worker Process Support
- Generate unique file names based on worker process IDs
- Prevent file name collisions in parallel test execution
- Organize files by test worker for easier debugging

### 🧩 Extensible Architecture
- Hook into the file name assignment process
- Customize naming strategies for different file types
- Integrate with the testring plugin system

### 🔧 Configuration Options
- Define static paths for different file categories
- Control file name uniqueness policies
- Support for global and worker-specific file paths

## Installation

```bash
# Using npm
npm install --save-dev @testring/plugin-fs-store

# Using yarn
yarn add --dev @testring/plugin-fs-store

# Using pnpm
pnpm add --save-dev @testring/plugin-fs-store
```

## Basic Usage

Configure the plugin in your `.testringrc` file and specify the static paths for different file types:

```json
{
  "plugins": [
    ["@testring/plugin-fs-store", {
      "staticPaths": {
        "screenshot": "./screens",
        "log": "./logs",
        "report": "./reports"
      }
    }]
  ]
}
```

The plugin hooks into the `FSStoreServer` and executes the `onFileNameAssign` hook when files are created, generating unique file names based on the request information.

## Configuration

### Plugin Configuration

The plugin accepts a configuration object with the following options:

```typescript
interface PluginConfig {
  staticPaths?: Record<string, string>;
}
```

#### staticPaths

A mapping of file types to their corresponding output directories:

```json
{
  "staticPaths": {
    "screenshot": "./screenshots",
    "log": "./logs",
    "report": "./reports",
    "coverage": "./coverage",
    "artifact": "./artifacts"
  }
}
```

### Complete Configuration Example

```json
{
  "plugins": [
    [
      "@testring/plugin-fs-store",
      {
        "staticPaths": {
          "screenshot": "./test-results/screenshots",
          "log": "./test-results/logs",
          "report": "./test-results/reports",
          "coverage": "./test-results/coverage",
          "video": "./test-results/videos",
          "trace": "./test-results/traces"
        }
      }
    ]
  ]
}
```

## How It Works

### File Name Generation Process

1. **Hook Registration**: The plugin registers a callback with the `FSStoreServer`'s `onFileNameAssign` hook
2. **Request Processing**: When a file is created, the hook receives file metadata and request information
3. **Path Resolution**: The plugin determines the appropriate directory based on file type and static path configuration
4. **Name Generation**: Unique file names are generated based on worker ID, file type, and other metadata
5. **Path Assembly**: The final file path is constructed and returned to the file system

### File Naming Strategy

The plugin uses the following naming strategy:

```
{staticPath}/{extraPath}/{workerId}_{subtype}_{uniqueId}.{extension}
```

Where:
- `staticPath`: Configured path for the file type
- `extraPath`: Additional path segments from metadata
- `workerId`: Test worker process identifier (if using worker-specific naming)
- `subtype`: File subtype for further categorization
- `uniqueId`: Generated unique identifier to prevent conflicts
- `extension`: File extension

### Example File Paths

With the configuration above, files might be organized as:

```
test-results/
├── screenshots/
│   ├── worker-1_login_a1b2c.png
│   ├── worker-1_dashboard_d3e4f.png
│   └── worker-2_profile_g5h6i.png
├── logs/
│   ├── worker-1_test_j7k8l.log
│   └── worker-2_test_m9n0o.log
└── reports/
    ├── junit_p1q2r.xml
    └── coverage_s3t4u.json
```

## Usage Examples

### Basic Screenshot Management

```typescript
// In your test file
import { FSScreenshotFactory } from '@testring/fs-store';

// Create a screenshot file
const screenshotFile = FSScreenshotFactory.create({
  type: 'screenshot',
  subtype: 'login-page'
});

// The plugin will automatically organize it under ./screenshots/
await screenshotFile.write(screenshotBuffer);
```

### Log File Organization

```typescript
import { FSTextFactory } from '@testring/fs-store';

// Create a log file
const logFile = FSTextFactory.create({
  type: 'log',
  subtype: 'test-execution',
  ext: 'log'
});

// The plugin will place it under ./logs/
await logFile.write(Buffer.from('Test execution started\n'));
```

### Custom File Types

```typescript
import { FSBinaryFactory } from '@testring/fs-store';

// Create a custom artifact file
const artifactFile = FSBinaryFactory.create({
  type: 'artifact',
  subtype: 'performance-data',
  ext: 'bin'
});

// The plugin will organize it under ./artifacts/
await artifactFile.write(performanceDataBuffer);
```

### Worker-Specific File Organization

```typescript
import { FSStoreFile } from '@testring/fs-store';

// Create a file with worker-specific naming
const workerFile = new FSStoreFile({
  meta: {
    type: 'log',
    subtype: 'worker-output',
    uniqPolicy: 'worker', // Use worker-specific naming
    workerId: 'worker-1',
    ext: 'log'
  }
});

// File will be named something like: worker-1_worker-output_abc123.log
await workerFile.write(Buffer.from('Worker 1 output\n'));
```

## Advanced Configuration

### Dynamic Path Generation

You can create more complex path structures by using subtypes and extra paths:

```typescript
// This will create a file at: ./screenshots/login/success/worker-1_final_xyz789.png
const screenshotFile = FSScreenshotFactory.create({
  type: 'screenshot',
  subtype: ['login', 'success'],
  extraPath: 'final',
  workerId: 'worker-1'
});
```

### Global vs Worker-Specific Files

```typescript
// Global file (shared across workers)
const globalReport = FSTextFactory.create({
  type: 'report',
  fileName: 'test-summary.json',
  global: true
});

// Worker-specific file
const workerLog = FSTextFactory.create({
  type: 'log',
  uniqPolicy: 'worker',
  workerId: 'worker-2'
});
```

### Preserving Original File Names

```typescript
// Preserve the original file name
const preservedFile = FSBinaryFactory.create({
  type: 'artifact',
  fileName: 'important-data.bin',
  preserveName: true
});
```

## Integration with Test Frameworks

### Jest Integration

```javascript
// jest.config.js
module.exports = {
  // ... other Jest configuration
  setupFilesAfterEnv: ['<rootDir>/test-setup.js']
};

// test-setup.js
import { FSScreenshotFactory } from '@testring/fs-store';

// Configure screenshot capture on test failure
afterEach(async () => {
  if (global.testState?.failed) {
    const screenshot = FSScreenshotFactory.create({
      type: 'screenshot',
      subtype: 'failure',
      fileName: `${global.testState.testName}.png`
    });

    // Capture and save screenshot
    const screenshotBuffer = await captureScreenshot();
    await screenshot.write(screenshotBuffer);
  }
});
```

### Mocha Integration

```javascript
// test/hooks.js
import { FSTextFactory } from '@testring/fs-store';

afterEach(function() {
  if (this.currentTest.state === 'failed') {
    const logFile = FSTextFactory.create({
      type: 'log',
      subtype: 'failure',
      fileName: `${this.currentTest.title}.log`
    });

    // Save test failure information
    const failureInfo = `
      Test: ${this.currentTest.title}
      Error: ${this.currentTest.err.message}
      Stack: ${this.currentTest.err.stack}
    `;

    logFile.write(Buffer.from(failureInfo));
  }
});
```

## API Reference

### Plugin Function

```typescript
function plugin(pluginAPI: PluginAPI, config: PluginConfig): void
```

The main plugin function that registers the file naming hook with the FSStoreServer.

### Configuration Interface

```typescript
interface PluginConfig {
  staticPaths?: Record<string, string>;
}
```

### File Naming Hook

The plugin generates a callback function that processes file naming requests:

```typescript
type FileNameCallback = (
  fileName: string,
  requestData: IOnFileNameHookData
) => Promise<string>
```

Where `IOnFileNameHookData` contains:
- `meta`: File metadata including type, subtype, extension
- `workerId`: Current worker process identifier
- `requestId`: Unique request identifier

## Best Practices

### 1. Directory Organization
- **Use descriptive type names**: Choose clear, consistent names for file types
- **Create logical hierarchies**: Organize files in a way that makes sense for your project
- **Separate by environment**: Consider different paths for different test environments

### 2. File Naming
- **Include timestamps**: For files that might be generated multiple times
- **Use worker IDs**: For parallel test execution to avoid conflicts
- **Be consistent**: Maintain consistent naming patterns across your test suite

### 3. Path Management
- **Use relative paths**: Make your configuration portable across environments
- **Create directories early**: Ensure output directories exist before tests run
- **Clean up regularly**: Implement cleanup strategies for old test artifacts

### 4. Performance Considerations
- **Avoid deep nesting**: Very deep directory structures can impact performance
- **Monitor disk usage**: Test artifacts can accumulate quickly
- **Use appropriate file types**: Choose the right file factory for your data

## Troubleshooting

### Common Issues

1. **Directory not found errors**:
   ```
   Error: ENOENT: no such file or directory
   ```
   - Ensure output directories exist or can be created
   - Check file path permissions

2. **File name conflicts**:
   ```
   Error: File already exists
   ```
   - Verify unique naming policies are configured correctly
   - Check worker ID assignment

3. **Configuration not applied**:
   - Verify plugin is properly registered in `.testringrc`
   - Check configuration syntax and structure

### Debug Tips

```javascript
// Enable debug logging for file operations
process.env.DEBUG = 'testring:fs-store';

// Check plugin registration
console.log('FSStore plugin registered with paths:', config.staticPaths);
```

## Dependencies

- **`@testring/plugin-api`** - Plugin API interface
- **`@testring/types`** - TypeScript type definitions
- **`@testring/utils`** - Utility functions for file operations

## Related Modules

- **`@testring/fs-store`** - Core file storage module
- **`@testring/test-utils`** - Testing utility functions
- **`@testring/cli-config`** - Configuration management

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.
