# Core Modules

This directory contains documentation for all testring core modules.

## Architecture Overview

The core modules provide the foundational functionality for the testring framework:

- **API Layer** - Test execution and control interfaces
- **CLI Tools** - Command line interface and argument processing  
- **Process Management** - Multi-process test execution and communication
- **File System** - Test file discovery and reading
- **Logging System** - Distributed logging and management
- **Plugin System** - Extensible plugin architecture

## Core Modules

### API and Control
- [api.md](api.md) - Core API interfaces
- [cli.md](cli.md) - Command line interface
- [cli-config.md](cli-config.md) - CLI configuration
- [test-run-controller.md](test-run-controller.md) - Test execution control
- [test-worker.md](test-worker.md) - Test worker processes

### File System and Dependencies
- [fs-reader.md](fs-reader.md) - File system reading
- [fs-store.md](fs-store.md) - File system storage
- [dependencies-builder.md](dependencies-builder.md) - Dependency analysis

### Communication and Transport
- [transport.md](transport.md) - Inter-process communication
- [child-process.md](child-process.md) - Child process management

### Plugin System
- [pluggable-module.md](pluggable-module.md) - Plugin architecture
- [plugin-api.md](plugin-api.md) - Plugin API

### Testing Utilities
- [async-assert.md](async-assert.md) - Asynchronous assertions
- [async-breakpoints.md](async-breakpoints.md) - Debugging breakpoints
- [sandbox.md](sandbox.md) - Test sandboxing

### Core Framework
- [testring.md](testring.md) - Main framework module
- [logger.md](logger.md) - Logging system
- [types.md](types.md) - TypeScript type definitions
- [utils.md](utils.md) - Utility functions

## Quick Links

- [Main Documentation](../README.md)
- [Package Documentation](../packages/README.md)
- [API Reference](../api/README.md)
