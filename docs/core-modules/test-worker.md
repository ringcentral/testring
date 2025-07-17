# @testring/test-worker

Test worker process module that serves as the execution engine for the testring framework, responsible for creating and managing test worker processes to ensure tests run in independent, isolated environments with parallel execution. This module is the core of test execution, providing complete process lifecycle management, compilation support, and communication mechanisms.

[![npm version](https://badge.fury.io/js/@testring/test-worker.svg)](https://www.npmjs.com/package/@testring/test-worker)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Feature Overview

The test worker process module is the execution core of the testring framework, providing:
- Multi-process parallel test execution
- Complete process isolation and resource management
- Flexible code compilation and plugin support
- Efficient inter-process communication mechanisms
- Comprehensive error handling and recovery strategies
- Debugging and development support

## Key Features

### Process Management
- Intelligent worker process creation and destruction
- Support for local mode and multi-process mode
- Process resource monitoring and management
- Automatic recovery of abnormal processes

### Code Compilation
- Support for TypeScript and JavaScript
- Pluggable compiler system
- Dynamic code loading and execution
- Compilation caching and optimization

### Communication Mechanism
- Efficient inter-process communication (IPC)
- Bidirectional message passing
- Serialization and deserialization support
- Communication error handling and retry

### Isolated Environment
- Each test runs in an independent process
- Prevents interference between tests
- Independent memory space and resources
- Complete environment cleanup

## Installation

```bash
npm install @testring/test-worker
```

## Core Architecture

### TestWorker Class
The main worker process manager responsible for creating and configuring worker process instances:

```typescript
class TestWorker extends PluggableModule {
  constructor(
    transport: ITransport,
    workerConfig: ITestWorkerConfig
  )

  spawn(): ITestWorkerInstance
}
```

### TestWorkerInstance Interface
Abstract interface for worker process instances:

```typescript
interface ITestWorkerInstance {
  getWorkerID(): string;
  execute(
    file: IFile,
    parameters: any,
    envParameters: any
  ): Promise<void>;
  kill(signal?: string): Promise<void>;
}
```

### Worker Process Types

#### 1. TestWorkerInstance (Multi-process Mode)
Actual child process implementation that executes tests in an independent Node.js process.

#### 2. TestWorkerLocal (Local Mode)
Implementation that executes tests in the current process, mainly used for debugging.

## Basic Usage

### Creating and Configuring Worker Processes

```typescript
import { TestWorker } from '@testring/test-worker';
import { Transport } from '@testring/transport';

// Create transport layer
const transport = new Transport();

// Configure worker process
const workerConfig = {
  debug: false,
  compilerOptions: {
    target: 'ES2019',
    module: 'commonjs'
  }
};

// Create worker process manager
const testWorker = new TestWorker(transport, workerConfig);

// Spawn worker process instance
const workerInstance = testWorker.spawn();

console.log(`Worker Process ID: ${workerInstance.getWorkerID()}`);
```

### Executing a Single Test

```typescript
// Test file object
const testFile = {
  path: './tests/example.spec.js',
  content: `
    describe('Example Test', () => {
      it('should pass basic test', () => {
        expect(1 + 1).toBe(2);
      });
    });
  `
};

// Test parameters
const parameters = {
  timeout: 30000,
  retries: 3
};

// Environment parameters
const envParameters = {
  baseUrl: 'https://example.com',
  apiKey: 'test-api-key'
};

try {
  // Execute test
  await workerInstance.execute(testFile, parameters, envParameters);
  console.log('Test execution successful');
} catch (error) {
  console.error('Test execution failed:', error);
} finally {
  // Clean up worker process
  await workerInstance.kill();
}
```

### Parallel Execution of Multiple Tests

```typescript
import { TestWorker } from '@testring/test-worker';

async function runTestsInParallel(testFiles, workerCount = 4) {
  const testWorker = new TestWorker(transport, workerConfig);

  // Create worker process pool
  const workers = Array.from({ length: workerCount }, () => testWorker.spawn());

  try {
    // Distribute tests to different worker processes
    const promises = testFiles.map((testFile, index) => {
      const worker = workers[index % workerCount];
      return worker.execute(testFile, parameters, envParameters);
    });

    // Wait for all tests to complete
    const results = await Promise.allSettled(promises);

    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Tests completed: ${successful} successful, ${failed} failed`);

    return results;
  } finally {
    // Clean up all worker processes
    await Promise.all(workers.map(worker => worker.kill()));
  }
}

// Usage example
const testFiles = [
  { path: './tests/test1.spec.js', content: '...' },
  { path: './tests/test2.spec.js', content: '...' },
  { path: './tests/test3.spec.js', content: '...' },
  { path: './tests/test4.spec.js', content: '...' }
];

await runTestsInParallel(testFiles, 2);
```

## Configuration Options

### TestWorkerConfig Interface

```typescript
interface ITestWorkerConfig {
  // Debug mode
  debug?: boolean;

  // Compiler options
  compilerOptions?: {
    target?: string;
    module?: string;
    strict?: boolean;
    esModuleInterop?: boolean;
  };

  // Process options
  processOptions?: {
    execArgv?: string[];        // Node.js execution arguments
    env?: object;               // Environment variables
    timeout?: number;           // Process timeout
  };

  // Working directory
  cwd?: string;

  // Maximum memory limit
  maxMemory?: string;

  // Plugin configuration
  plugins?: string[];
}
```

### Configuration Examples

#### Development Environment Configuration
```typescript
const devConfig = {
  debug: true,                          // Enable debug output
  compilerOptions: {
    target: 'ES2019',
    module: 'commonjs',
    strict: false,                      // Relaxed type checking
    esModuleInterop: true
  },
  processOptions: {
    execArgv: ['--inspect=9229'],       // Enable debugger
    timeout: 60000                      // Longer timeout
  }
};
```

#### Production Environment Configuration
```typescript
const prodConfig = {
  debug: false,
  compilerOptions: {
    target: 'ES2019',
    module: 'commonjs',
    strict: true,                       // Strict type checking
    esModuleInterop: true
  },
  processOptions: {
    timeout: 30000,                     // Shorter timeout
    env: {
      NODE_ENV: 'production'
    }
  },
  maxMemory: '2GB'                      // Memory limit
};
```

#### CI/CD Environment Configuration
```typescript
const ciConfig = {
  debug: false,
  compilerOptions: {
    target: 'ES2019',
    module: 'commonjs',
    strict: true
  },
  processOptions: {
    timeout: 45000,
    env: {
      NODE_ENV: 'test',
      CI: 'true'
    }
  }
};
```

## Working Modes

### Multi-process Mode (Default)

In multi-process mode, each test executes in an independent Node.js child process:

```typescript
// Multi-process mode configuration
const multiProcessConfig = {
  workerLimit: 4,                       // Create 4 worker processes
  restartWorker: true,                  // Restart process after each test
  debug: false
};

const testWorker = new TestWorker(transport, multiProcessConfig);

// Create worker process instances (will start child processes)
const worker1 = testWorker.spawn();    // Child process 1
const worker2 = testWorker.spawn();    // Child process 2
const worker3 = testWorker.spawn();    // Child process 3
const worker4 = testWorker.spawn();    // Child process 4

// Execute tests in parallel
await Promise.all([
  worker1.execute(test1, params, env),
  worker2.execute(test2, params, env),
  worker3.execute(test3, params, env),
  worker4.execute(test4, params, env)
]);
```

**Advantages:**
- Complete process isolation
- True parallel execution
- Errors don't affect other tests
- Can utilize multi-core CPU

**Disadvantages:**
- Process creation overhead
- Higher memory usage
- Relatively difficult to debug

### Local Mode

In local mode, all tests execute sequentially in the current process:

```typescript
// Local mode configuration
const localConfig = {
  workerLimit: 'local',                 // Local mode
  debug: true                           // Convenient for debugging
};

const testWorker = new TestWorker(transport, localConfig);

// Create local worker process instance
const localWorker = testWorker.spawn();

// Execute test in current process
await localWorker.execute(testFile, params, env);
```

**Advantages:**
- Fast startup speed
- Debug-friendly
- Low memory usage
- Clear error stack traces

**Disadvantages:**
- No process isolation
- Cannot execute in parallel
- Tests may interfere with each other

## Code Compilation System

### Compiler Plugins

TestWorker supports a pluggable compiler system:

```typescript
// Custom compiler plugin
const customCompilerPlugin = (pluginAPI) => {
  const testWorker = pluginAPI.getTestWorker();

  if (testWorker) {
    // Pre-compilation processing
    testWorker.getHook('beforeCompile')?.writeHook('customPreprocess', async (filePaths) => {
      console.log('Pre-compilation preprocessing:', filePaths);
      return filePaths;
    });

    // Custom compilation logic
    testWorker.getHook('compile')?.writeHook('customCompiler', async (source, filename) => {
      console.log(`Compiling file: ${filename}`);

      // TypeScript compilation
      if (filename.endsWith('.ts')) {
        return compileTypeScript(source, filename);
      }

      // Babel compilation
      if (filename.endsWith('.jsx')) {
        return compileBabel(source, filename);
      }

      // Return JavaScript directly
      return source;
    });
  }
};

// Register compiler plugin
const testWorker = new TestWorker(transport, {
  plugins: [customCompilerPlugin]
});
```

### TypeScript Support

```typescript
// TypeScript compilation configuration
const tsConfig = {
  compilerOptions: {
    target: 'ES2019',
    module: 'commonjs',
    strict: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    resolveJsonModule: true,
    allowSyntheticDefaultImports: true
  }
};

// TypeScript compiler plugin
const typescriptPlugin = (pluginAPI) => {
  const testWorker = pluginAPI.getTestWorker();

  testWorker?.getHook('compile')?.writeHook('typescript', async (source, filename) => {
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      const ts = require('typescript');

      const result = ts.transpile(source, tsConfig.compilerOptions, filename);
      return result;
    }

    return source;
  });
};
```

### Babel Support

```typescript
// Babel compiler plugin
const babelPlugin = (pluginAPI) => {
  const testWorker = pluginAPI.getTestWorker();

  testWorker?.getHook('compile')?.writeHook('babel', async (source, filename) => {
    if (filename.endsWith('.jsx') || filename.endsWith('.js')) {
      const babel = require('@babel/core');

      const result = babel.transform(source, {
        filename,
        presets: [
          '@babel/preset-env',
          '@babel/preset-react'
        ],
        plugins: [
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-decorators'
        ]
      });

      return result.code;
    }

    return source;
  });
};
```

## Inter-Process Communication

### Communication Protocol

Worker processes use a message-based communication protocol:

```typescript
// Message type definitions
interface WorkerMessage {
  type: 'execute' | 'kill' | 'ping' | 'result' | 'error';
  payload?: any;
  id?: string;
}

// Execute test message
const executeMessage: WorkerMessage = {
  type: 'execute',
  id: 'test-123',
  payload: {
    file: testFile,
    parameters: testParams,
    envParameters: envParams
  }
};

// Test result message
const resultMessage: WorkerMessage = {
  type: 'result',
  id: 'test-123',
  payload: {
    success: true,
    duration: 1500,
    output: 'Test passed successfully'
  }
};

// Error message
const errorMessage: WorkerMessage = {
  type: 'error',
  id: 'test-123',
  payload: {
    error: 'AssertionError: Expected true, got false',
    stack: '...'
  }
};
```

### Communication Examples

```typescript
// Custom worker process communication handling
class CustomTestWorkerInstance {
  private messageHandlers = new Map();

  constructor(private transport: ITransport) {
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    // Handle test results
    this.transport.on('message', (message: WorkerMessage) => {
      switch (message.type) {
        case 'result':
          this.handleTestResult(message);
          break;
        case 'error':
          this.handleTestError(message);
          break;
        case 'progress':
          this.handleTestProgress(message);
          break;
      }
    });
  }

  private handleTestResult(message: WorkerMessage) {
    console.log(`Test ${message.id} completed:`, message.payload);

    // Trigger result handler
    const handler = this.messageHandlers.get(message.id);
    if (handler) {
      handler.resolve(message.payload);
      this.messageHandlers.delete(message.id);
    }
  }

  private handleTestError(message: WorkerMessage) {
    console.error(`Test ${message.id} failed:`, message.payload);

    // Trigger error handler
    const handler = this.messageHandlers.get(message.id);
    if (handler) {
      handler.reject(new Error(message.payload.error));
      this.messageHandlers.delete(message.id);
    }
  }

  private handleTestProgress(message: WorkerMessage) {
    console.log(`Test ${message.id} progress:`, message.payload);
  }

  async execute(file: IFile, parameters: any, envParameters: any): Promise<any> {
    const testId = this.generateTestId();

    return new Promise((resolve, reject) => {
      // Register message handler
      this.messageHandlers.set(testId, { resolve, reject });

      // Send execute message
      this.transport.send({
        type: 'execute',
        id: testId,
        payload: { file, parameters, envParameters }
      });

      // Set timeout
      setTimeout(() => {
        if (this.messageHandlers.has(testId)) {
          this.messageHandlers.delete(testId);
          reject(new Error('Test execution timeout'));
        }
      }, parameters.timeout || 30000);
    });
  }

  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Advanced Usage

### Worker Process Pool Management

```typescript
class TestWorkerPool {
  private workers: ITestWorkerInstance[] = [];
  private availableWorkers: ITestWorkerInstance[] = [];
  private busyWorkers = new Set<ITestWorkerInstance>();
  private testQueue: Array<{
    file: IFile;
    parameters: any;
    envParameters: any;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(
    private testWorker: TestWorker,
    private poolSize: number = 4
  ) {
    this.initializePool();
  }

  private async initializePool() {
    // Create worker process pool
    for (let i = 0; i < this.poolSize; i++) {
      const worker = this.testWorker.spawn();
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  async execute(file: IFile, parameters: any, envParameters: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Add to queue
      this.testQueue.push({ file, parameters, envParameters, resolve, reject });

      // Try to execute next test
      this.executeNext();
    });
  }

  private async executeNext() {
    if (this.testQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const worker = this.availableWorkers.pop()!;
    const testTask = this.testQueue.shift()!;

    this.busyWorkers.add(worker);

    try {
      const result = await worker.execute(
        testTask.file,
        testTask.parameters,
        testTask.envParameters
      );

      testTask.resolve(result);
    } catch (error) {
      testTask.reject(error);
    } finally {
      // Return worker process
      this.busyWorkers.delete(worker);
      this.availableWorkers.push(worker);

      // Execute next test
      this.executeNext();
    }
  }

  async destroy() {
    // Clean up all worker processes
    await Promise.all(this.workers.map(worker => worker.kill()));
    this.workers.length = 0;
    this.availableWorkers.length = 0;
    this.busyWorkers.clear();
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.busyWorkers.size,
      queuedTests: this.testQueue.length
    };
  }
}

// Usage example
const pool = new TestWorkerPool(testWorker, 4);

try {
  const results = await Promise.all([
    pool.execute(test1, params, env),
    pool.execute(test2, params, env),
    pool.execute(test3, params, env),
    pool.execute(test4, params, env)
  ]);

  console.log('All tests completed:', results);
} finally {
  await pool.destroy();
}
```

### Dynamic Worker Process Management

```typescript
class DynamicTestWorkerManager {
  private workers = new Map<string, ITestWorkerInstance>();
  private workerStats = new Map<string, {
    testsExecuted: number;
    averageDuration: number;
    lastActivity: number;
  }>();

  constructor(
    private testWorker: TestWorker,
    private minWorkers: number = 2,
    private maxWorkers: number = 8
  ) {
    this.maintainMinWorkers();
    this.startWorkerMonitoring();
  }

  private async maintainMinWorkers() {
    while (this.workers.size < this.minWorkers) {
      await this.createWorker();
    }
  }

  private async createWorker(): Promise<string> {
    const worker = this.testWorker.spawn();
    const workerId = worker.getWorkerID();

    this.workers.set(workerId, worker);
    this.workerStats.set(workerId, {
      testsExecuted: 0,
      averageDuration: 0,
      lastActivity: Date.now()
    });

    console.log(`Created worker process: ${workerId}`);
    return workerId;
  }

  private async removeWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    if (worker) {
      await worker.kill();
      this.workers.delete(workerId);
      this.workerStats.delete(workerId);
      console.log(`Removed worker process: ${workerId}`);
    }
  }

  private startWorkerMonitoring() {
    setInterval(() => {
      this.cleanupIdleWorkers();
      this.scaleWorkers();
    }, 10000); // Check every 10 seconds
  }

  private cleanupIdleWorkers() {
    const now = Date.now();
    const idleThreshold = 60000; // 1 minute

    for (const [workerId, stats] of this.workerStats) {
      if (now - stats.lastActivity > idleThreshold && this.workers.size > this.minWorkers) {
        this.removeWorker(workerId);
      }
    }
  }

  private async scaleWorkers() {
    const queueLength = this.getQueueLength(); // Assume method to get queue length
    const activeWorkers = this.getActiveWorkerCount();

    // If queue is long, add worker processes
    if (queueLength > activeWorkers * 2 && this.workers.size < this.maxWorkers) {
      await this.createWorker();
    }

    // If too many workers and queue is empty, reduce worker processes
    if (queueLength === 0 && this.workers.size > this.minWorkers) {
      const idleWorkers = Array.from(this.workers.keys())
        .filter(id => this.isWorkerIdle(id))
        .slice(0, this.workers.size - this.minWorkers);

      for (const workerId of idleWorkers) {
        await this.removeWorker(workerId);
      }
    }
  }

  async execute(file: IFile, parameters: any, envParameters: any): Promise<any> {
    // Select optimal worker process
    const workerId = this.selectOptimalWorker();
    const worker = this.workers.get(workerId);

    if (!worker) {
      throw new Error('No available worker processes');
    }

    const startTime = Date.now();
    const stats = this.workerStats.get(workerId)!;

    try {
      const result = await worker.execute(file, parameters, envParameters);

      // Update statistics
      const duration = Date.now() - startTime;
      stats.testsExecuted++;
      stats.averageDuration = (stats.averageDuration + duration) / 2;
      stats.lastActivity = Date.now();

      return result;
    } catch (error) {
      stats.lastActivity = Date.now();
      throw error;
    }
  }

  private selectOptimalWorker(): string {
    // Select worker process with shortest average execution time
    let bestWorker = '';
    let bestScore = Infinity;

    for (const [workerId, stats] of this.workerStats) {
      const score = stats.averageDuration || 1000; // Default 1 second
      if (score < bestScore) {
        bestScore = score;
        bestWorker = workerId;
      }
    }

    return bestWorker || Array.from(this.workers.keys())[0];
  }

  private getActiveWorkerCount(): number {
    // Get number of working processes
    return Array.from(this.workers.keys())
      .filter(id => !this.isWorkerIdle(id))
      .length;
  }

  private isWorkerIdle(workerId: string): boolean {
    const stats = this.workerStats.get(workerId);
    return stats ? Date.now() - stats.lastActivity > 5000 : true;
  }

  private getQueueLength(): number {
    // This should return the actual queue length
    return 0;
  }

  async destroy() {
    await Promise.all(
      Array.from(this.workers.values()).map(worker => worker.kill())
    );
    this.workers.clear();
    this.workerStats.clear();
  }
}
```

## Error Handling and Recovery

### Process Exception Handling

```typescript
class RobustTestWorker extends TestWorker {
  private failedWorkers = new Set<string>();
  private maxRetries = 3;

  spawn(): ITestWorkerInstance {
    const worker = super.spawn();
    const workerId = worker.getWorkerID();

    // Wrap worker process to add error handling
    return this.wrapWorkerWithErrorHandling(worker, workerId);
  }

  private wrapWorkerWithErrorHandling(
    worker: ITestWorkerInstance,
    workerId: string
  ): ITestWorkerInstance {
    const originalExecute = worker.execute.bind(worker);

    worker.execute = async (file: IFile, parameters: any, envParameters: any) => {
      let retryCount = 0;

      while (retryCount < this.maxRetries) {
        try {
          return await originalExecute(file, parameters, envParameters);
        } catch (error) {
          retryCount++;

          if (this.isRecoverableError(error)) {
            console.warn(`Worker process ${workerId} recoverable error, retry ${retryCount}/${this.maxRetries}:`, error.message);

            // Wait before retrying
            await this.delay(1000 * retryCount);

            // If process crashed, recreate worker process
            if (this.isProcessCrashError(error)) {
              await this.recreateWorker(worker, workerId);
            }
          } else {
            // Unrecoverable error, throw directly
            throw error;
          }
        }
      }

      // Retry count exhausted, mark as failed
      this.failedWorkers.add(workerId);
      throw new Error(`Worker process ${workerId} execution failed, maximum retry count reached`);
    };

    return worker;
  }

  private isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      'ECONNRESET',
      'EPIPE',
      'process exited',
      'worker terminated'
    ];

    return recoverablePatterns.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private isProcessCrashError(error: Error): boolean {
    return error.message.includes('process exited') ||
           error.message.includes('worker terminated');
  }

  private async recreateWorker(
    worker: ITestWorkerInstance,
    workerId: string
  ): Promise<void> {
    try {
      // Try to clean up old process
      await worker.kill();
    } catch (cleanupError) {
      console.warn(`Failed to clean up worker process ${workerId}:`, cleanupError);
    }

    // Create new worker process instance
    const newWorker = super.spawn();

    // Replace method implementation (needs adjustment based on actual implementation)
    Object.setPrototypeOf(worker, Object.getPrototypeOf(newWorker));
    Object.assign(worker, newWorker);

    console.log(`Worker process ${workerId} has been recreated`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getFailedWorkers(): string[] {
    return Array.from(this.failedWorkers);
  }

  resetFailedWorkers(): void {
    this.failedWorkers.clear();
  }
}
```

### Memory Leak Detection

```typescript
class MemoryMonitoredTestWorker extends TestWorker {
  private memoryThreshold = 500 * 1024 * 1024; // 500MB
  private monitoringInterval: NodeJS.Timeout | null = null;

  spawn(): ITestWorkerInstance {
    const worker = super.spawn();
    const workerId = worker.getWorkerID();

    // Start memory monitoring
    this.startMemoryMonitoring(worker, workerId);

    return worker;
  }

  private startMemoryMonitoring(
    worker: ITestWorkerInstance,
    workerId: string
  ): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const memoryUsage = await this.getWorkerMemoryUsage(worker);

        if (memoryUsage > this.memoryThreshold) {
          console.warn(`Worker process ${workerId} high memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);

          // Try garbage collection
          await this.triggerGarbageCollection(worker);

          // Check memory usage again
          const newMemoryUsage = await this.getWorkerMemoryUsage(worker);

          if (newMemoryUsage > this.memoryThreshold * 0.8) {
            console.error(`Worker process ${workerId} may have memory leak, restarting process`);
            await this.restartWorker(worker, workerId);
          }
        }
      } catch (error) {
        console.error(`Failed to monitor worker process ${workerId} memory:`, error);
      }
    }, 10000); // Check every 10 seconds
  }

  private async getWorkerMemoryUsage(worker: ITestWorkerInstance): Promise<number> {
    // Logic to get worker process memory usage needs to be implemented here
    // Can be obtained through inter-process communication
    return 0; // Placeholder implementation
  }

  private async triggerGarbageCollection(worker: ITestWorkerInstance): Promise<void> {
    // Send garbage collection command to worker process
    // This requires implementing corresponding handling logic in the worker process
  }

  private async restartWorker(worker: ITestWorkerInstance, workerId: string): Promise<void> {
    try {
      await worker.kill();
      // Logic to recreate worker process needed here
      console.log(`Worker process ${workerId} has been restarted`);
    } catch (error) {
      console.error(`Failed to restart worker process ${workerId}:`, error);
    }
  }

  stopMemoryMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}
```

## Debugging and Development Support

### Debug Mode

```typescript
class DebuggableTestWorker extends TestWorker {
  private debugMode: boolean;
  private debugPort = 9229;

  constructor(transport: ITransport, config: ITestWorkerConfig & { debug?: boolean }) {
    super(transport, config);
    this.debugMode = config.debug || false;
  }

  spawn(): ITestWorkerInstance {
    if (this.debugMode) {
      return this.spawnDebugWorker();
    }

    return super.spawn();
  }

  private spawnDebugWorker(): ITestWorkerInstance {
    const debugConfig = {
      ...this.workerConfig,
      processOptions: {
        ...this.workerConfig.processOptions,
        execArgv: [
          `--inspect=${this.debugPort}`,
          '--inspect-brk'  // Pause on startup
        ]
      }
    };

    console.log(`Starting debug mode worker process, debug port: ${this.debugPort}`);
    console.log(`Connect using Chrome DevTools: chrome://inspect`);

    this.debugPort++; // Assign new port for next process

    // Create worker process with debug configuration
    return new TestWorkerInstance(
      this.transport,
      this.compile,
      this.beforeCompile,
      debugConfig
    );
  }
}

// Using debug mode
const debugWorker = new DebuggableTestWorker(transport, {
  debug: true,
  compilerOptions: {
    target: 'ES2019',
    sourceMap: true  // Enable source maps
  }
});

// Execute test in debug mode
const worker = debugWorker.spawn();
await worker.execute(testFile, parameters, envParameters);
```

### Performance Profiling

```typescript
class ProfilingTestWorker extends TestWorker {
  private profilingEnabled: boolean;
  private profileData = new Map<string, any>();

  constructor(transport: ITransport, config: ITestWorkerConfig & { profiling?: boolean }) {
    super(transport, config);
    this.profilingEnabled = config.profiling || false;
  }

  spawn(): ITestWorkerInstance {
    const worker = super.spawn();

    if (this.profilingEnabled) {
      return this.wrapWorkerWithProfiling(worker);
    }

    return worker;
  }

  private wrapWorkerWithProfiling(worker: ITestWorkerInstance): ITestWorkerInstance {
    const originalExecute = worker.execute.bind(worker);
    const workerId = worker.getWorkerID();

    worker.execute = async (file: IFile, parameters: any, envParameters: any) => {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();

      try {
        const result = await originalExecute(file, parameters, envParameters);

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();

        // Record performance data
        this.recordPerformanceData(workerId, file.path, {
          duration: Number(endTime - startTime) / 1000000, // Convert to milliseconds
          memoryDelta: {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external
          },
          success: true
        });

        return result;
      } catch (error) {
        const endTime = process.hrtime.bigint();

        this.recordPerformanceData(workerId, file.path, {
          duration: Number(endTime - startTime) / 1000000,
          success: false,
          error: error.message
        });

        throw error;
      }
    };

    return worker;
  }

  private recordPerformanceData(workerId: string, testPath: string, data: any): void {
    const key = `${workerId}:${testPath}`;
    this.profileData.set(key, {
      ...data,
      timestamp: Date.now()
    });
  }

  getPerformanceReport(): any {
    const report = {
      summary: {
        totalTests: this.profileData.size,
        successfulTests: 0,
        failedTests: 0,
        averageDuration: 0,
        totalMemoryUsed: 0
      },
      details: []
    };

    let totalDuration = 0;
    let totalMemory = 0;

    for (const [key, data] of this.profileData) {
      const [workerId, testPath] = key.split(':');

      if (data.success) {
        report.summary.successfulTests++;
      } else {
        report.summary.failedTests++;
      }

      totalDuration += data.duration;
      if (data.memoryDelta) {
        totalMemory += data.memoryDelta.heapUsed;
      }

      report.details.push({
        workerId,
        testPath,
        ...data
      });
    }

    report.summary.averageDuration = totalDuration / this.profileData.size;
    report.summary.totalMemoryUsed = totalMemory;

    // Sort by execution time
    report.details.sort((a, b) => b.duration - a.duration);

    return report;
  }

  exportPerformanceData(filename: string): void {
    const report = this.getPerformanceReport();
    const fs = require('fs');

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`Performance report exported to: ${filename}`);
  }
}

// Using performance profiling
const profilingWorker = new ProfilingTestWorker(transport, {
  profiling: true
});

// Execute test
const worker = profilingWorker.spawn();
await worker.execute(testFile, parameters, envParameters);

// Generate performance report
const report = profilingWorker.getPerformanceReport();
console.log('Performance statistics:', report.summary);

// Export detailed report
profilingWorker.exportPerformanceData('./performance-report.json');
```

## Best Practices

### 1. Worker Process Configuration
- Set worker process count appropriately based on CPU core count
- Use local mode in development environment for easier debugging
- Enable process restart in production environment to ensure isolation
- Set appropriate memory limits to avoid system resource exhaustion

### 2. Code Compilation
- Configure appropriate compilers for different file types
- Enable source maps for easier debugging
- Use compilation caching to improve performance
- Configure appropriate TypeScript options

### 3. Error Handling
- Implement comprehensive error classification and recovery mechanisms
- Monitor worker process health status
- Provide detailed error context information
- Establish process restart and failover strategies

### 4. Performance Optimization
- Use worker process pools to reduce creation overhead
- Implement intelligent load balancing algorithms
- Monitor memory usage to avoid leaks
- Regularly clean up and restart long-running processes

### 5. Debugging and Monitoring
- Enable detailed debugging features in development environment
- Collect and analyze process execution data
- Implement performance monitoring and analysis tools
- Establish comprehensive logging systems

## Troubleshooting

### Common Issues

#### Worker Process Startup Failed
```bash
Error: spawn ENOENT
```
Solution: Check Node.js path and permissions, confirm system environment configuration is correct.

#### Inter-Process Communication Failed
```bash
Error: IPC channel closed
```
Solution: Check if process is running normally, add communication retry mechanism.

#### High Memory Usage
```bash
Error: out of memory
```
Solution: Reduce concurrent process count, enable memory monitoring and garbage collection.

### Debugging Tips

```typescript
// Enable detailed debugging
const debugConfig = {
  debug: true,
  workerLimit: 'local',
  compilerOptions: {
    sourceMap: true
  },
  processOptions: {
    execArgv: ['--inspect=9229']
  }
};

// Monitor worker process status
worker.on('error', (error) => {
  console.error('Worker process error:', error);
});

worker.on('exit', (code, signal) => {
  console.log(`Worker process exited: code=${code}, signal=${signal}`);
});
```

## Dependencies

- `@testring/pluggable-module` - Plugin system foundation
- `@testring/child-process` - Child process management
- `@testring/transport` - Inter-process communication
- `@testring/logger` - Logging
- `@testring/types` - Type definitions

## Related Modules

- `@testring/test-run-controller` - Test run controller
- `@testring/sandbox` - Code sandbox
- `@testring/cli` - Command line interface

## License

MIT License