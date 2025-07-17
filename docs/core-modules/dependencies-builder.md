# @testring/dependencies-builder

Dependency analysis and build module that provides analysis, resolution, and building of test file dependencies.

## Overview

This module is responsible for analyzing JavaScript/TypeScript file dependencies, building dependency dictionaries and dependency trees, providing complete dependency information for test execution:
- Static analysis of `require()` calls in files
- Building complete dependency graphs
- Resolving relative and absolute paths
- Handling circular dependencies
- Excluding node_modules dependencies

## Key Features

### Static Code Analysis
- Code structure parsing based on Babel AST
- Identifying `require()` calls and module references
- Supporting CommonJS module system
- Handling dynamic dependency path resolution

### Dependency Tree Building
- Recursively building complete dependency relationships
- Caching mechanism to avoid duplicate parsing
- Handling circular dependency situations
- Generating flattened dependency dictionaries

### Path Resolution
- Converting relative paths to absolute paths
- Auto-completing file extensions
- Cross-platform path handling
- Node.js module resolution rules

## Installation

```bash
npm install --save-dev @testring/dependencies-builder
```

Or using yarn:

```bash
yarn add @testring/dependencies-builder --dev
```

## Main API

### buildDependencyDictionary
Builds a dependency dictionary for a file:

```typescript
import { buildDependencyDictionary } from '@testring/dependencies-builder';

const dependencyDict = await buildDependencyDictionary(file, readFileFunction);
```

### mergeDependencyDictionaries
Merges multiple dependency dictionaries:

```typescript
import { mergeDependencyDictionaries } from '@testring/dependencies-builder';

const mergedDict = await mergeDependencyDictionaries(dict1, dict2);
```

## Usage

### Basic Usage
```typescript
import { buildDependencyDictionary } from '@testring/dependencies-builder';
import { fs } from '@testring/utils';

// Prepare file reading function
const readFile = async (filePath: string): Promise<string> => {
  return await fs.readFile(filePath, 'utf8');
};

// Analyze file dependencies
const file = {
  path: './src/main.js',
  content: `
    const helper = require('./helper');
    const utils = require('../utils/index');
    
    module.exports = {
      run: () => {
        helper.doSomething();
        utils.log('Done');
      }
    };
  `
};

const dependencyDict = await buildDependencyDictionary(file, readFile);
console.log('Dependencies:', dependencyDict);
```

### Dependency Dictionary Structure
```typescript
// Dependency dictionary format
type DependencyDict = {
  [absolutePath: string]: {
    [requirePath: string]: {
      path: string;      // Absolute path of dependency file
      content: string;   // Content of dependency file
    }
  }
};

// Example output
{
  "/project/src/main.js": {
    "./helper": {
      path: "/project/src/helper.js",
      content: "module.exports = { doSomething: () => {} };"
    },
    "../utils/index": {
      path: "/project/utils/index.js", 
      content: "module.exports = { log: console.log };"
    }
  },
  "/project/src/helper.js": {},
  "/project/utils/index.js": {}
}
```

### Handling Circular Dependencies
```typescript
// Module A depends on Module B and Module B also depends on Module A
const fileA = {
  path: './a.js',
  content: 'const b = require("./b"); module.exports = { fromA: true };'
};

const fileB = {
  path: './b.js', 
  content: 'const a = require("./a"); module.exports = { fromB: true };'
};

// The dependency builder will handle circular dependencies correctly
const deps = await buildDependencyDictionary(fileA, readFile);
// Won't fall into infinite recursion
```

### Merging Dependency Dictionaries
```typescript
// When there are multiple entry files, you can merge their dependency dictionaries
const dict1 = await buildDependencyDictionary(file1, readFile);
const dict2 = await buildDependencyDictionary(file2, readFile);

const mergedDict = await mergeDependencyDictionaries(dict1, dict2);
// Contains all dependencies of both files
```

## Path Resolution Rules

### Relative Path Resolution
```typescript
// Resolves from /project/src/main.js
'./helper'      → '/project/src/helper.js'
'../utils'      → '/project/utils/index.js'
'./config.json' → '/project/src/config.json'
```

### File Extension Handling
```typescript
// Automatically tries common extensions
'./module'  → tries './module.js', './module.json', './module/index.js'
```

### Exclude Node.js Modules
```typescript
// These dependencies are excluded and not included in the dependency dictionaries
require('fs')           // Node.js built-in module
require('lodash')       // Package from node_modules
require('@babel/core')  // Scoped package
```

## Performance Optimization

### Caching Mechanism
- Parsed files are cached
- Avoid parsing the same files multiple times
- Supports handling of circular dependencies

### Memory Management
- Reasonable memory usage
- Avoiding memory leaks
- Suitable for large projects

## Error Handling

### File Not Found
```typescript
// When a dependency file does not exist
try {
  const deps = await buildDependencyDictionary(file, readFile);
} catch (error) {
  console.error('Dependency parsing failed:', error.message);
}
```

### Syntax Errors
```typescript
// When a file contains syntax errors
const fileWithSyntaxError = {
  path: './bad.js',
  content: 'const x = ; // Syntax error'
};

// The builder will throw a parsing error
```

## Integration with Test Framework

This module is usually used with other testring modules:

### Integration with fs-reader
```typescript
import { FSReader } from '@testring/fs-reader';
import { buildDependencyDictionary } from '@testring/dependencies-builder';

const fsReader = new FSReader();
const file = await fsReader.readFile('./test.spec.js');

if (file) {
  const deps = await buildDependencyDictionary(file, fsReader.readFile);
  // Obtain complete test file dependencies
}
```

### Integration with sandbox
```typescript
// Dependency dictionary can be passed to be used in a sandbox environment
import { Sandbox } from '@testring/sandbox';

const deps = await buildDependencyDictionary(file, readFile);
const sandbox = new Sandbox(file.content, file.path, deps);
sandbox.execute();
```

## Type Definitions

This module uses types defined in `@testring/types`:

```typescript
interface IDependencyDictionarycTe {
  [key: string]: T;
}

interface IDependencyDictionaryNode {
  path: string;
  content: string;
}

interface IDependencyTreeNode {
  path: string;
  content: string;
  nodes: IDependencyDictionarycIDependencyTreeNodee | null;
}

type DependencyDict = IDependencyDictionarycIDependencyDictionarycIDependencyDictionaryNodeee;
type DependencyFileReader = (path: string) =e Promisecstringe;
```

## Best Practices

### Organizing Code Structure
- Maintain clear directory structure
- Avoid deep dependency nesting
- Use consistent module import style

### Handling Large Projects
- Consider performance impact of dependency analysis
- Appropriately use caching mechanisms
- Monitor memory usage

### Debugging Dependency Issues
- Inspect generated dependency dictionaries
- Validate path resolution results
- Confirm file existence
