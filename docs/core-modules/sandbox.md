# @testring/sandbox

Code sandbox execution module that provides a secure JavaScript code execution environment with dependency injection and module isolation support.

## Feature Overview

This module provides a code execution sandbox based on Node.js `vm` module, with main features including:
- Secure code execution environment
- Module dependency management and injection
- Circular dependency handling
- Context isolation and control
- Dynamic code execution and evaluation

## Key Features

### Secure Execution Environment
- Create isolated environment based on Node.js `vm.createContext()`
- Control access to global variables
- Prevent code pollution of main process
- Support custom context objects

### Dependency Management
- Automatically handle module dependencies
- Support relative and absolute paths
- Circular dependency detection and handling
- Module caching mechanism

### Dynamic Execution
- Support dynamic code evaluation
- Runtime code injection
- Module hot reloading
- Script compilation and execution

## Installation

```bash
npm install --save-dev @testring/sandbox
```

Or using yarn:

```bash
yarn add @testring/sandbox --dev
```

## Main API

### Sandbox Class
Main sandbox execution class:

```typescript
export class Sandbox {
  constructor(
    source: string,           // Source code
    filename: string,         // File name
    dependencies: DependencyDict  // Dependency dictionary
  )

  // Execute code and return exported object
  execute(): any

  // Get sandbox context
  getContext(): any

  // Static method: clear module cache
  static clearCache(): void

  // Static method: evaluate script code
  static evaluateScript(filename: string, code: string): Promise<Sandbox>
}
```

## Usage

### Basic Usage
```typescript
import { Sandbox } from '@testring/sandbox';

// Prepare dependency dictionary
const dependencies = {
  '/project/main.js': {
    './helper': {
      path: '/project/helper.js',
      content: 'module.exports = { add: (a, b) => a + b };'
    }
  },
  '/project/helper.js': {}
};

// Create sandbox
const sandbox = new Sandbox(
  `
    const helper = require('./helper');
    module.exports = {
      calculate: (x, y) => helper.add(x, y) * 2
    };
  `,
  '/project/main.js',
  dependencies
);

// Execute code
const exports = sandbox.execute();
console.log(exports.calculate(3, 4)); // Output: 14
```

### Handling Complex Modules
```typescript
import { Sandbox } from '@testring/sandbox';

const testCode = `
  const assert = require('assert');
  const utils = require('./utils');

  // Test cases
  function runTests() {
    assert.equal(utils.add(1, 2), 3);
    assert.equal(utils.multiply(3, 4), 12);
    console.log('All tests passed!');
  }

  module.exports = { runTests };
`;

const dependencies = {
  '/tests/main.test.js': {
    './utils': {
      path: '/tests/utils.js',
      content: `
        module.exports = {
          add: (a, b) => a + b,
          multiply: (a, b) => a * b
        };
      `
    }
  },
  '/tests/utils.js': {}
};

const sandbox = new Sandbox(testCode, '/tests/main.test.js', dependencies);
const testModule = sandbox.execute();
testModule.runTests(); // Execute tests
```

### Dynamic Code Execution
```typescript
import { Sandbox } from '@testring/sandbox';

// First create base sandbox
const baseSandbox = new Sandbox(
  'module.exports = { data: [] };',
  '/app/data.js',
  {}
);
baseSandbox.execute();

// Dynamically execute additional code
const dynamicCode = `
  const dataModule = require('/app/data.js');
  dataModule.data.push('new data');
  console.log('Data added:', dataModule.data);
`;

await Sandbox.evaluateScript('/app/dynamic.js', dynamicCode);
```

### Circular Dependency Handling
```typescript
// Module A
const moduleA = `
  const b = require('./moduleB');
  module.exports = {
    name: 'A',
    getBName: () => b.name,
    value: 'valueA'
  };
`;

// Module B (depends on Module A)
const moduleB = `
  const a = require('./moduleA');
  module.exports = {
    name: 'B',
    getAValue: () => a.value,
    data: 'dataB'
  };
`;

const dependencies = {
  '/modules/moduleA.js': {
    './moduleB': {
      path: '/modules/moduleB.js',
      content: moduleB
    }
  },
  '/modules/moduleB.js': {
    './moduleA': {
      path: '/modules/moduleA.js',
      content: moduleA
    }
  }
};

// Sandbox will correctly handle circular dependencies
const sandbox = new Sandbox(moduleA, '/modules/moduleA.js', dependencies);
const exportedA = sandbox.execute();

console.log(exportedA.name);        // 'A'
console.log(exportedA.getBName());  // 'B'
```

## Context Environment

### Sandbox Context
The sandbox provides the following context variables for each module:

```typescript
// These variables are available to each module
{
  __dirname: string,    // Current file's directory path
  __filename: string,   // Current file's full path
  require: Function,    // Module loading function
  module: {            // Module object
    filename: string,   // File name
    id: string,        // Module ID
    exports: any       // Export object
  },
  exports: any,        // Shortcut reference to module exports
  global: object       // Global object reference
}
```

### Custom Context
```typescript
// You can add custom context by extending or modifying Sandbox
class CustomSandbox extends Sandbox {
  protected createContext(filename: string, dependencies: DependencyDict) {
    const context = super.createContext(filename, dependencies);

    // Add custom global variables
    context.myGlobal = 'custom value';
    context.setTimeout = setTimeout;
    context.clearTimeout = clearTimeout;

    return context;
  }
}
```

## Module Caching

### Caching Mechanism
```typescript
// Sandbox automatically caches resolved modules
const sandbox1 = new Sandbox(code1, 'file1.js', deps);
const sandbox2 = new Sandbox(code2, 'file2.js', deps);

// If file2.js depends on file1.js, it will directly use cached sandbox1
sandbox1.execute();
sandbox2.execute();
```

### Cache Cleanup
```typescript
// Clear all module cache
Sandbox.clearCache();

// Subsequently created sandboxes will re-parse all modules
const freshSandbox = new Sandbox(code, filename, deps);
```

## Error Handling

### Execution Errors
```typescript
try {
  const sandbox = new Sandbox(
    'throw new Error("Test error");',
    'error-test.js',
    {}
  );
  sandbox.execute();
} catch (error) {
  console.error('Sandbox execution error:', error.message);
}
```

### Syntax Errors
```typescript
try {
  const sandbox = new Sandbox(
    'const x = ; // Syntax error',
    'syntax-error.js',
    {}
  );
  sandbox.execute();
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('Code syntax error:', error.message);
  }
}
```

### Missing Dependencies
```typescript
const sandbox = new Sandbox(
  'const missing = require("./not-exists");',
  'main.js',
  {} // Empty dependency dictionary
);

try {
  sandbox.execute();
} catch (error) {
  console.error('Missing dependency:', error.message);
}
```

## Performance Optimization

### Module Precompilation
```typescript
// For repeatedly used code, modules can be precompiled
const precompiledModules = new Map();

function getOrCreateSandbox(filename: string, source: string, deps: DependencyDict) {
  if (precompiledModules.has(filename)) {
    return precompiledModules.get(filename);
  }

  const sandbox = new Sandbox(source, filename, deps);
  precompiledModules.set(filename, sandbox);
  return sandbox;
}
```

### Memory Management
```typescript
// Periodically clean unused module cache
setInterval(() => {
  if (shouldCleanCache()) {
    Sandbox.clearCache();
  }
}, 60000); // Check every minute
```

## Integration with Testing Framework

### Integration with dependencies-builder
```typescript
import { buildDependencyDictionary } from '@testring/dependencies-builder';
import { Sandbox } from '@testring/sandbox';

// Build dependency dictionary
const deps = await buildDependencyDictionary(testFile, readFile);

// Execute test in sandbox
const sandbox = new Sandbox(testFile.content, testFile.path, deps);
const testModule = sandbox.execute();
```

### Test Isolation
```typescript
// Each test executes in an independent sandbox
async function runTest(testFile) {
  const deps = await buildDependencyDictionary(testFile, readFile);
  const sandbox = new Sandbox(testFile.content, testFile.path, deps);

  try {
    const testModule = sandbox.execute();
    if (typeof testModule.run === 'function') {
      await testModule.run();
    }
  } finally {
    // Clean up after test completion
    Sandbox.clearCache();
  }
}
```

## Security Considerations

### Code Execution Limitations
Although the sandbox provides an isolated environment, you should still note:
- Do not execute untrusted code
- Limit file system access
- Monitor memory and CPU usage
- Set execution timeouts

### Permission Control
```typescript
// You can limit module access through custom require function
class SecureSandbox extends Sandbox {
  private require(requestPath: string) {
    // Check if module access is allowed
    if (isAllowedModule(requestPath)) {
      return super.require(requestPath);
    } else {
      throw new Error(`Module access denied: ${requestPath}`);
    }
  }
}
```

## Best Practices

### Module Organization
- Keep modules with single responsibility
- Avoid overly deep dependency nesting
- Use clear module interfaces

### Error Handling
- Always handle sandbox execution exceptions
- Provide detailed error information
- Implement appropriate fallback strategies

### Performance Optimization
- Use module caching appropriately
- Avoid repeatedly creating sandboxes
- Monitor memory usage

## Type Definitions

```typescript
interface DependencyDict {
  [absolutePath: string]: {
    [requirePath: string]: {
      path: string;
      content: string;
    }
  }
}

interface SandboxContext {
  __dirname: string;
  __filename: string;
  require: (path: string) => any;
  module: {
    filename: string;
    id: string;
    exports: any;
  };
  exports: any;
  global: any;
}
```