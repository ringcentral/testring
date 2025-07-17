# @testring/types

TypeScript type definition module that provides complete type support and interface definitions for the testring framework.

## Overview

This module is the type definition center for the testring framework, containing:
- TypeScript interface definitions for all core modules
- Common types and enum definitions
- Configuration object type specifications
- Type support for plugin development
- Test-related data structure definitions

## Key Features

### Complete Type Support
- Type definitions covering all framework modules
- Strict TypeScript type checking
- Comprehensive generic support
- Detailed interface documentation

### Modular Design
- Type definitions organized by functional modules
- Clear namespace separation
- Easy to extend and maintain
- Supports selective imports

### Developer-Friendly
- IDE intelligent hints
- Compile-time type checking
- Detailed type annotations
- Examples and usage instructions

## Installation

```bash
npm install --save-dev @testring/types
```

Or using yarn:

```bash
yarn add @testring/types --dev
```

## Main Type Categories

### Configuration Types
Defines framework configuration related interfaces:

```typescript
// Main configuration interface
interface IConfig {
  tests: string;                    // Test file glob pattern
  plugins: Array<string | IPlugin>; // Plugin list
  workerLimit: number | 'local';    // Worker process limit
  retryCount: number;               // Retry count
  retryDelay: number;               // Retry delay
  logLevel: LogLevel;               // Log level
  bail: boolean;                    // Stop immediately on failure
  testTimeout: number;              // Test timeout
  debug: boolean;                   // Debug mode
}

// Logger configuration
interface IConfigLogger {
  logLevel: LogLevel;
  silent: boolean;
}

// Plugin configuration
interface IPlugin {
  name: string;
  config?: any;
}
```

### Test-Related Types
Defines interfaces for test execution and management:

```typescript
// Test file interface
interface IFile {
  path: string;           // File path
  content: string;        // File content
  dependencies?: string[]; // Dependency list
}

// Queued test item
interface IQueuedTest {
  path: string;           // Test file path
  content?: string;       // Test content
  retryCount?: number;    // Current retry count
  maxRetryCount?: number; // Maximum retry count
}

// Test execution result
interface ITestExecutionResult {
  success: boolean;       // Whether successful
  error?: Error;         // Error information
  duration?: number;     // Execution duration
  retryCount?: number;   // Retry count
}
```

### Inter-Process Communication Types
Defines interfaces for inter-process communication:

```typescript
// Transport layer interface
interface ITransport {
  send<T>(processID: string, messageType: string, payload: T): Promise<void>;
  broadcast<T>(messageType: string, payload: T): void;
  on<T>(messageType: string, callback: TransportMessageHandler<T>): void;
  once<T>(messageType: string, callback: TransportMessageHandler<T>): void;
  registerChild(processID: string, child: IWorkerEmitter): void;
  getProcessesList(): string[];
}

// Message handler
type TransportMessageHandler<T> = (message: T, processID?: string) => void;

// Direct transport message format
interface ITransportDirectMessage {
  type: string;
  payload: any;
}
```

### Worker Process Types
Defines interfaces for test worker processes:

```typescript
// Test worker process instance
interface ITestWorkerInstance {
  getWorkerID(): string;
  execute(test: IQueuedTest): Promise<void>;
  kill(): Promise<void>;
}

// Child process fork options
interface IChildProcessForkOptions {
  debug: boolean;
  debugPort?: number;
  debugPortRange?: number[];
  execArgv?: string[];
  silent?: boolean;
}

// Fork result
interface IChildProcessFork {
  send(message: any): void;
  on(event: string, callback: Function): void;
  kill(signal?: string): void;
  debugPort?: number;
}
```

### File Storage Types
Defines interfaces for the file storage system:

```typescript
// File storage client
interface IFSStoreClient {
  createTextFile(options: IFSStoreTextFileOptions): Promise<IFSStoreTextFile>;
  createBinaryFile(options: IFSStoreBinaryFileOptions): Promise<IFSStoreBinaryFile>;
  createScreenshotFile(options: IFSStoreScreenshotFileOptions): Promise<IFSStoreScreenshotFile>;
}

// File storage options
interface IFSStoreFileOptions {
  ext?: string;           // File extension
  name?: string;          // File name
  content?: any;          // File content
}

// File storage file interface
interface IFSStoreFile {
  fullPath: string;       // Full path
  write(content: any): Promise<void>;
  read(): Promise<any>;
  release(): Promise<void>;
}
```

### Browser Proxy Types
Defines interfaces for browser automation:

```typescript
// Browser proxy interface
interface IBrowserProxy {
  start(): Promise<void>;
  stop(): Promise<void>;
  execute(command: IBrowserCommand): Promise<any>;
  takeScreenshot(): Promise<Buffer>;
}

// Browser command
interface IBrowserCommand {
  type: string;
  args: any[];
  timeout?: number;
}

// Browser options
interface IBrowserProxyOptions {
  headless: boolean;
  width: number;
  height: number;
  userAgent?: string;
  proxy?: string;
}
```

### HTTP-Related Types
Defines HTTP service and client interfaces:

```typescript
// HTTP client interface
interface IHttpClient {
  get(url: string, options?: any): Promise<any>;
  post(url: string, data?: any, options?: any): Promise<any>;
  put(url: string, data?: any, options?: any): Promise<any>;
  delete(url: string, options?: any): Promise<any>;
  request(options: any): Promise<any>;
}

// HTTP server interface
interface IHttpServer {
  start(port?: number): Promise<void>;
  stop(): Promise<void>;
  addRoute(method: string, path: string, handler: Function): void;
  getPort(): number;
}

// HTTP request options
interface IHttpRequestOptions {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
}
```

### Plugin System Types
Defines interfaces for plugin development:

```typescript
// Plugin module collection
interface IPluginModules {
  logger: ILogger;
  fsReader?: IFSReader;
  testWorker: ITestWorker;
  testRunController: ITestRunController;
  browserProxy: IBrowserProxy;
  httpServer: IHttpServer;
  httpClientInstance: IHttpClient;
  fsStoreServer: IFSStoreServer;
}

// Plugin function type
type PluginFunction = (api: IPluginAPI) => void | Promise<void>;

// Plugin API interface
interface IPluginAPI {
  getLogger(): ILoggerAPI;
  getFSReader(): IFSReaderAPI | null;
  getTestWorker(): ITestWorkerAPI;
  getTestRunController(): ITestRunControllerAPI;
  getBrowserProxy(): IBrowserProxyAPI;
  getHttpServer(): IHttpServerAPI;
  getHttpClient(): IHttpClient;
  getFSStoreServer(): IFSStoreServerAPI;
}
```

### Logging System Types
Defines interfaces for logging:

```typescript
// Log level enumeration
enum LogLevel {
  verbose = 'verbose',
  debug = 'debug',
  info = 'info',
  warning = 'warning',
  error = 'error',
  silent = 'silent'
}

// Logger client interface
interface ILoggerClient {
  verbose(...args: any[]): void;
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

// Log entity
interface ILogEntity {
  logLevel: LogLevel;
  content: any[];
  timestamp: number;
  processID?: string;
}
```

## Usage Examples

### Using Types in Projects
```typescript
import {
  IConfig,
  IQueuedTest,
  ITestWorkerInstance,
  LogLevel
} from '@testring/types';

// Configuration object
const config: IConfig = {
  tests: './tests/**/*.spec.js',
  plugins: ['@testring/plugin-selenium-driver'],
  workerLimit: 2,
  retryCount: 3,
  retryDelay: 1000,
  logLevel: LogLevel.info,
  bail: false,
  testTimeout: 30000,
  debug: false
};

// Test queue item
const queuedTest: IQueuedTest = {
  path: './tests/login.spec.js',
  retryCount: 0,
  maxRetryCount: 3
};
```

### Implementing Interfaces
```typescript
import { ITestWorkerInstance, IQueuedTest } from '@testring/types';

class MyTestWorker implements ITestWorkerInstance {
  private workerID: string;

  constructor(id: string) {
    this.workerID = id;
  }

  getWorkerID(): string {
    return this.workerID;
  }

  async execute(test: IQueuedTest): Promise<void> {
    console.log(`Executing test: ${test.path}`);
    // Test execution logic
  }

  async kill(): Promise<void> {
    console.log(`Stopping worker process: ${this.workerID}`);
    // Cleanup logic
  }
}
```

### Plugin Development Type Support
```typescript
import { PluginFunction, IPluginAPI } from '@testring/types';

const myPlugin: PluginFunction = (api: IPluginAPI) => {
  const logger = api.getLogger();
  const testWorker = api.getTestWorker();

  testWorker.beforeRun(async () => {
    await logger.info('Plugin initialization completed');
  });
};

export default myPlugin;
```

### Generic Usage
```typescript
import { Queue, IQueue } from '@testring/types';

// Create type-safe queue
const testQueue: IQueue<IQueuedTest> = new Queue<IQueuedTest>();

testQueue.push({
  path: './test1.spec.js',
  retryCount: 0
});

const nextTest = testQueue.shift(); // Type is IQueuedTest | void
```

## Enumeration Definitions

### Log Levels
```typescript
enum LogLevel {
  verbose = 'verbose',
  debug = 'debug',
  info = 'info',
  warning = 'warning',
  error = 'error',
  silent = 'silent'
}
```

### Breakpoint Types
```typescript
enum BreakpointsTypes {
  beforeInstruction = 'beforeInstruction',
  afterInstruction = 'afterInstruction'
}
```

### Browser Events
```typescript
enum BrowserProxyEvents {
  beforeStart = 'beforeStart',
  afterStart = 'afterStart',
  beforeStop = 'beforeStop',
  afterStop = 'afterStop'
}
```

### HTTP Methods
```typescript
enum HttpMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}
```

## Utility Types

### Queue and Stack
```typescript
// Queue interface
interface IQueue<T> {
  push(...elements: T[]): void;
  shift(): T | void;
  clean(): void;
  remove(fn: (item: T, index: number) => boolean): number;
  extract(fn: (item: T, index: number) => boolean): T[];
  getFirstElement(offset?: number): T | null;
  length: number;
}

// Stack interface
interface IStack<T> {
  push(...elements: T[]): void;
  pop(): T | void;
  clean(): void;
  length: number;
}
```

### Dependency Dictionary
```typescript
// Dependency dictionary type
type DependencyDict = IDependencyDictionary<IDependencyDictionary<IDependencyDictionaryNode>>;

// Dependency dictionary interface
interface IDependencyDictionary<T> {
  [key: string]: T;
}

// Dependency node
interface IDependencyDictionaryNode {
  path: string;
  content: string;
}

// Dependency tree node
interface IDependencyTreeNode {
  path: string;
  content: string;
  nodes: IDependencyDictionary<IDependencyTreeNode> | null;
}
```

### Hooks and Callbacks
```typescript
// Hook callback type
type HookCallback<T> = (payload: T) => Promise<void> | void;

// Breakpoint callback type
type HasBreakpointCallback = (hasBreakpoint: boolean) => Promise<void> | void;

// File reader type
type DependencyFileReader = (path: string) => Promise<string>;

// Message handler type
type TransportMessageHandler<T> = (message: T, processID?: string) => void;
```

## Extended Types

### Custom Configuration Extension
```typescript
// Extend base configuration
interface ICustomConfig extends IConfig {
  customOption: string;
  advancedSettings: {
    cacheEnabled: boolean;
    maxCacheSize: number;
  };
}
```

### Custom Plugin Modules
```typescript
// Extend plugin module collection
interface IExtendedPluginModules extends IPluginModules {
  customModule: ICustomModule;
}
```

## Best Practices

### Type Safety
```typescript
// Use strict type checking
function createTestWorker(config: IConfig): ITestWorkerInstance {
  // Implementation ensures type safety
  return new TestWorker(config);
}

// Use type guards
function isQueuedTest(obj: any): obj is IQueuedTest {
  return obj && typeof obj.path === 'string';
}
```

### Generic Usage
```typescript
// Create type-safe generic functions
function processQueue<T>(queue: IQueue<T>, processor: (item: T) => void): void {
  let item = queue.shift();
  while (item) {
    processor(item);
    item = queue.shift();
  }
}
```

### Interface Extension
```typescript
// Properly extend interfaces
interface IEnhancedLogger extends ILoggerClient {
  logWithTimestamp(level: LogLevel, ...args: any[]): void;
  getLogHistory(): ILogEntity[];
}
```

## Module Dependencies

This module is a pure type definition module that contains no runtime code. It can be safely used in any TypeScript project without adding runtime overhead.

## Version Compatibility

Type definitions follow semantic versioning:
- **Major version**: Breaking type changes
- **Minor version**: New type definitions
- **Patch version**: Type fixes and optimizations

## IDE Support

This module provides complete type support for the following IDEs:
- Visual Studio Code
- WebStorm / IntelliJ IDEA
- Sublime Text (with TypeScript plugin)
- Atom (with TypeScript plugin)
- Vim/Neovim (with appropriate plugins)