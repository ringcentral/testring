# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

testring is a modern Node.js-based automated UI testing framework designed for web applications. It provides multi-process parallel test execution, rich plugin system, multi-browser support (Chrome, Firefox, Safari, Edge), and supports both Selenium and Playwright drivers.

## Architecture

### Monorepo Structure
- **`core/`** - Core modules providing framework foundations (24 packages)
- **`packages/`** - Extension packages with plugins and tools (14 packages)
- **`docs/`** - Documentation files
- **`utils/`** - Build and maintenance utilities

### Core Module Dependencies (10-Layer Architecture)
The core modules follow a strict layered architecture with clear dependency hierarchy:

**Layer 0 (Base):** `types`, `async-breakpoints`
**Layer 1 (Utils):** `utils`, `pluggable-module`, `async-assert`
**Layer 2 (Infrastructure):** `child-process`, `transport`, `dependencies-builder`
**Layer 3 (Services):** `logger`, `fs-reader`
**Layer 4 (Config/Storage):** `cli-config`, `fs-store`
**Layer 5 (APIs):** `api`, `plugin-api`
**Layer 6 (Advanced):** `sandbox`, `test-run-controller`
**Layer 7 (Execution):** `test-worker`
**Layer 8 (Interface):** `cli`
**Layer 9 (Entry):** `testring`

## Development Commands

### Build and Development
```bash
# Full build (main + devtool + extension)
npm run build

# Build only main packages
npm run build:main

# Watch mode for development
npm run build:watch

# Type checking
npm run check-types:main
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run single test file
lerna exec --scope @testring/[package-name] -- mocha test/[file].spec.ts
```

### Linting and Code Quality
```bash
# Lint all TypeScript files
npm run lint

# Fix linting issues
npm run lint:fix
```

### Package Management
```bash
# Clean all packages
npm run cleanup

# Reinstall all dependencies
npm run reinstall

# Check for dependency updates
npm run check-deps:find-updates
```

## Key Technical Details

### TypeScript Configuration
- Uses strict TypeScript configuration with comprehensive type checking
- Target: ES2019 (Node 18 baseline)
- Composite builds enabled for better performance
- All packages have individual `tsconfig.json` extending `tsconfig.base.json`

### Testing Framework
- Uses Mocha as the test runner
- Chai for assertions
- Sinon for mocking
- Tests run in parallel across packages using Lerna

### Build System
- Lerna monorepo with independent package versioning
- Each package builds to its own `dist/` directory
- Declaration files and source maps generated

### Package Structure
Each package follows consistent structure:
- `src/` - TypeScript source files
- `test/` - Test files (`.spec.ts`)
- `dist/` - Built output
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript config
- `tsconfig.build.json` - Build-specific config

## Working with Packages

### Adding New Packages
New packages should follow the existing structure and be placed in either `core/` or `packages/` depending on their purpose.

### Modifying Core Packages
When modifying core packages, be aware of the dependency hierarchy. Changes to lower-layer packages may affect multiple dependent packages.

### Plugin Development
Use the `plugin-api` package for creating new plugins. Follow existing plugin patterns in the `packages/` directory.

## Common Patterns

### Error Handling
The framework uses consistent error handling with the `restructure-error` utility and custom error types.

### Async Operations
All async operations use modern async/await patterns. The `async-assert` package provides testing utilities for async code.

### Inter-Process Communication
The `transport` package handles all IPC between test workers and the main process.

### File System Operations
Use `fs-reader` for reading test files and `fs-store` for managing test artifacts and caching.