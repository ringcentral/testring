# @testring/cli

Command line interface module that provides command line tools and user interaction functionality for the testring framework.

## Overview

This module serves as the command line entry point for the testring framework, responsible for:
- Parsing command line arguments
- Handling user input
- Managing test execution flow
- Providing command line help information

## Main Features

### Command Support
- **`run`** - Run tests command (default command)
- **`--help`** - Display help information
- **`--version`** - Display version information

### Configuration Options
Supports the following command line parameters:

- `--config` - Custom configuration file path
- `--tests` - Test file search pattern (glob pattern)
- `--plugins` - Plugin list
- `--bail` - Stop immediately after test failure
- `--workerLimit` - Number of parallel test worker processes
- `--retryCount` - Number of retries
- `--retryDelay` - Retry delay time
- `--logLevel` - Log level
- `--envConfig` - Environment configuration file path
- `--devtool` - Enable development tools (deprecated)

## Usage

### Basic Commands
```bash
# Run tests (default)
testring
testring run

# Specify test files
testring run --tests "./tests/**/*.spec.js"

# Use custom configuration
testring run --config ./my-config.json

# Set parallel worker process count
testring run --workerLimit 4

# Set retry count
testring run --retryCount 3

# Set log level
testring run --logLevel debug
```

### Plugin Configuration
```bash
# Use single plugin
testring run --plugins @testring/plugin-selenium-driver

# Use multiple plugins
testring run --plugins @testring/plugin-selenium-driver --plugins @testring/plugin-babel
```

### Environment Configuration
```bash
# Use environment configuration to override main configuration
testring run --config ./config.json --envConfig ./env.json
```

## Configuration Files

### Basic Configuration File (.testringrc)
```json
{
  "tests": "./tests/**/*.spec.js",
  "plugins": [
    "@testring/plugin-selenium-driver",
    "@testring/plugin-babel"
  ],
  "workerLimit": 2,
  "retryCount": 3,
  "retryDelay": 2000,
  "logLevel": "info",
  "bail": false
}
```

### JavaScript Configuration File
```javascript
module.exports = {
  tests: "./tests/**/*.spec.js",
  plugins: [
    "@testring/plugin-selenium-driver"
  ],
  workerLimit: 2,
  // Can be a function
  retryCount: process.env.CI ? 1 : 3
};
```

### Asynchronous Configuration File
```javascript
module.exports = async () => {
  const config = await loadConfiguration();
  return {
    tests: "./tests/**/*.spec.js",
    plugins: config.plugins,
    workerLimit: config.workerLimit
  };
};
```

## Error Handling

The CLI module provides comprehensive error handling mechanisms:
- Captures and formats runtime errors
- Provides detailed error information
- Supports graceful process exit
- Handles user interrupt signals (Ctrl+C)

## Process Management

Supports the following process signals:
- `SIGINT` - User interrupt (Ctrl+C)
- `SIGUSR1` - User signal 1
- `SIGUSR2` - User signal 2
- `SIGHUP` - Terminal hangup
- `SIGQUIT` - Quit signal
- `SIGABRT` - Abnormal termination
- `SIGTERM` - Termination signal

## Installation

```bash
npm install @testring/cli
```

## Dependencies

- `yargs` - Command line argument parsing
- `@testring/logger` - Logging
- `@testring/cli-config` - Configuration management
- `@testring/transport` - Process communication
- `@testring/types` - Type definitions

## Related Modules

- `@testring/cli-config` - Configuration file handling
- `@testring/api` - Test API
- `@testring/test-run-controller` - Test run control