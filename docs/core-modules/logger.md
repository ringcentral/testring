# @testring/logger

Distributed logging system module that provides logging and management functionality in multi-process environments.

## Overview

This module provides a complete logging solution, supporting:
- Log aggregation in multi-process environments
- Configurable log level filtering
- Plugin-based log processing
- Formatted log output

## Main Components

### LoggerServer
Log server responsible for processing and outputting logs:

```typescript
export class LoggerServer extends PluggableModule {
  constructor(
    config: IConfigLogger,
    transportInstance: ITransport,
    stdout: NodeJS.WritableStream
  )
}
```

### LoggerClient
Log client that provides logging interface:

```typescript
export interface ILoggerClient {
  verbose(...args: any[]): void
  debug(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
}
```

## Log Levels

Supports the following log levels (ordered by priority):

1. **`verbose`** - Most detailed debugging information
2. **`debug`** - Debug information
3. **`info`** - General information (default level)
4. **`warning`** - Warning information
5. **`error`** - Error information
6. **`silent`** - Silent mode, no log output

## Usage

### Basic Usage
```typescript
import { loggerClient } from '@testring/logger';

// Log different levels
loggerClient.verbose('Detailed debugging information');
loggerClient.debug('Debug information');
loggerClient.info('General information');
loggerClient.warn('Warning information');
loggerClient.error('Error information');
```

### Configure Log Level
```typescript
import { LoggerServer } from '@testring/logger';

const config = {
  logLevel: 'debug',  // Only show debug and above level logs
  silent: false       // Whether in silent mode
};

const loggerServer = new LoggerServer(config, transport, process.stdout);
```

### Log Formatting
```typescript
// Logs are automatically formatted for output
loggerClient.info('Test started', { testId: 'test-001' });
// Output: [INFO] Test started { testId: 'test-001' }
```

## Configuration Options

### Log Level Configuration
```typescript
interface IConfigLogger {
  logLevel: 'verbose' | 'debug' | 'info' | 'warning' | 'error' | 'silent';
  silent: boolean;  // Quick silent mode
}
```

### Command Line Configuration
```bash
# Set log level
testring run --logLevel debug

# Silent mode
testring run --silent

# Or
testring run --logLevel silent
```

### Configuration File
```json
{
  "logLevel": "debug",
  "silent": false
}
```

## Plugin Support

The logging system supports plugin extensions for custom log processing logic:

### Plugin Hooks
- `beforeLog` - Pre-processing before log output
- `onLog` - Processing during log output
- `onError` - Error handling

### Custom Log Plugin
```typescript
export default (pluginAPI) => {
  const logger = pluginAPI.getLogger();

  logger.beforeLog((logEntity, meta) => {
    // Log preprocessing
    return {
      ...logEntity,
      timestamp: new Date().toISOString()
    };
  });
  
  logger.onLog((logEntity, meta) => {
    // Custom log processing
    if (logEntity.logLevel === 'error') {
      // Send error report
      sendErrorReport(logEntity.content);
    }
  });
};
```

## Multi-Process Support

### Inter-Process Log Aggregation
The logging system automatically aggregates logs from all processes in a multi-process environment:

```typescript
// Log from child process
loggerClient.info('Child process log');

// Automatically transmitted to main process and output uniformly
// [INFO] [Worker-1] Child process log
```

### Process Identification
Each process's logs include process identification for easier debugging:
- Main process: No identifier
- Child process: `[Worker-{ID}]`

## Log Format

### Standard Format
```
[LEVEL] [ProcessID] Message
```

### Example Output
```
[INFO] Test started
[DEBUG] [Worker-1] Loading test file: test.spec.js
[WARN] [Worker-2] Test retry: 2nd attempt
[ERROR] [Worker-1] Test failed: Assertion error
```

## Performance Optimization

### Asynchronous Log Processing
- Uses queue system for log processing
- Avoids blocking main flow
- Supports batch processing

### Memory Management
- Automatic log queue cleanup
- Prevents memory leaks
- Configurable buffer size

## Debugging Features

### Log Tracing
```typescript
// Enable detailed log tracing
const config = {
  logLevel: 'verbose'
};

// Will output detailed execution information
loggerClient.verbose('Detailed debugging information', {
  stack: new Error().stack
});
```

### Error Context
Error logs include complete context information:
- Error stack trace
- Process information
- Timestamp
- Related parameters

## Installation

```bash
npm install @testring/logger
```

## Dependencies

- `@testring/pluggable-module` - Plugin support
- `@testring/utils` - Utility functions
- `@testring/transport` - Inter-process communication
- `@testring/types` - Type definitions

## Related Modules

- `@testring/cli` - Command line tools
- `@testring/plugin-api` - Plugin interface
- `@testring/transport` - Transport layer