# @testring/test-run-controller

Test run controller that serves as the core scheduling center of the testring framework, responsible for managing test queues, coordinating test worker processes, and providing complete test lifecycle control. This module implements orderly test execution through a queue mechanism, supporting parallel processing, retry mechanisms, and a rich plugin hook system.

[![npm version](https://badge.fury.io/js/@testring/test-run-controller.svg)](https://www.npmjs.com/package/@testring/test-run-controller)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Feature Overview

The test run controller is the scheduling core of the testring framework, providing:
- Intelligent test queue management and scheduling
- Flexible worker process configuration (local/multi-process)
- Comprehensive error handling and retry mechanisms
- Rich plugin hook extension points
- Timeout control and resource management
- Detailed execution status monitoring

## Key Features

### Queue Management
- Queue-based test scheduling system
- Support for dynamic queue modification and priority control
- Intelligent load balancing algorithms
- Complete queue lifecycle management

### Process Management
- Support for local process execution (`local` mode)
- Multi-child process parallel execution
- Worker process creation, management, and destruction
- Process exception handling and recovery

### Retry Mechanism
- Configurable retry count and delay
- Intelligent retry strategies
- Detailed monitoring of retry processes
- Plugin-controlled retry decisions

### Plugin System
- Rich lifecycle hooks
- Flexible plugin registration and management
- Support for complete customization of test workflows
- Error handling and state control

## Installation

```bash
npm install @testring/test-run-controller
```

## Core Concepts

### TestRunController Class
Main test run controller class that extends `PluggableModule`:

```typescript
class TestRunController extends PluggableModule {
  constructor(
    config: IConfig,
    testWorker: ITestWorker,
    devtoolConfig?: IDevtoolRuntimeConfiguration
  )

  async runQueue(testSet: IFile[]): Promise<Error[] | null>
  async kill(): Promise<void>
}
```

### Queue Item Structure
Representation of each test in the queue:

```typescript
interface IQueuedTest {
  retryCount: number;        // Current retry count
  retryErrors: Error[];      // Errors during retry process
  test: IFile;              // Test file information
  parameters: object;        // Test parameters
  envParameters: object;     // Environment parameters
}
```

## Basic Usage

### Creating and Configuring Controller

```typescript
import { TestRunController } from '@testring/test-run-controller';
import { TestWorker } from '@testring/test-worker';
import { loggerClient } from '@testring/logger';

// Configuration object
const config = {
  workerLimit: 2,           // Number of parallel worker processes
  retryCount: 3,           // Retry count
  retryDelay: 2000,        // Retry delay (milliseconds)
  testTimeout: 30000,      // Test timeout
  bail: false,             // Whether to stop on first failure
  debug: false,            // Debug mode
  logLevel: 'info',        // Log level
  screenshots: 'afterError' // Screenshot strategy
};

// Create controller
const testWorker = new TestWorker(config);
const controller = new TestRunController(config, testWorker);

// Run test queue
const testFiles = [
  { path: './tests/test1.spec.js', content: '...' },
  { path: './tests/test2.spec.js', content: '...' },
  { path: './tests/test3.spec.js', content: '...' }
];

const errors = await controller.runQueue(testFiles);

if (errors && errors.length > 0) {
  loggerClient.error(`Number of failed tests: ${errors.length}`);
  errors.forEach(error => {
    loggerClient.error('Test error:', error.message);
  });
} else {
  loggerClient.info('All tests executed successfully');
}
```

### Local Process Mode

```typescript
const config = {
  workerLimit: 'local',    // Run tests in current process
  retryCount: 2,
  retryDelay: 1000
};

const controller = new TestRunController(config, testWorker);
const errors = await controller.runQueue(testFiles);

// In local mode, tests will execute sequentially in the current process
// This is useful for debugging and development environments
```

### Multi-process Parallel Mode

```typescript
const config = {
  workerLimit: 4,          // Create 4 child processes
  restartWorker: true,     // Restart worker process after each test
  retryCount: 3,
  retryDelay: 2000,
  testTimeout: 60000
};

const controller = new TestRunController(config, testWorker);

// Listen to controller events
const beforeRunHook = controller.getHook('beforeRun');
const afterTestHook = controller.getHook('afterTest');

beforeRunHook?.readHook('monitor', (testQueue) => {
  console.log(`Preparing to execute ${testQueue.length} tests`);
});

afterTestHook?.readHook('reporter', (queuedTest, error, workerMeta) => {
  if (error) {
    console.log(`Test failed: ${queuedTest.test.path} (process ${workerMeta.processID})`);
  } else {
    console.log(`Test passed: ${queuedTest.test.path} (process ${workerMeta.processID})`);
  }
});

const errors = await controller.runQueue(testFiles);
```

## Configuration Options Details

### Core Configuration

```typescript
interface TestRunControllerConfig {
  // Worker process configuration
  workerLimit: number | 'local';     // Number of concurrent worker processes or local mode
  restartWorker?: boolean;           // Whether to restart process after each test

  // Retry configuration
  retryCount?: number;               // Maximum retry count (default 0)
  retryDelay?: number;               // Retry delay time (milliseconds, default 0)

  // Timeout configuration
  testTimeout?: number;              // Single test timeout (milliseconds)

  // Execution strategy
  bail?: boolean;                    // Whether to stop all tests on first failure

  // Debug and logging
  debug?: boolean;                   // Debug mode
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug';

  // Screenshot configuration
  screenshots?: 'disable' | 'enable' | 'afterError';
  screenshotPath?: string;

  // Development tools
  devtool?: boolean;                 // Whether to enable development tools

  // HTTP configuration
  httpThrottle?: number;             // HTTP request throttling

  // Environment parameters
  envParameters?: object;            // Environment parameters passed to tests
}
```

### Configuration Examples

#### Development Environment Configuration
```typescript
const devConfig = {
  workerLimit: 'local',              // Local mode for easier debugging
  retryCount: 1,                     // Minimal retries
  retryDelay: 1000,
  testTimeout: 30000,
  bail: true,                        // Fail fast
  debug: true,                       // Enable debugging
  logLevel: 'debug',
  screenshots: 'afterError',
  devtool: true
};
```

#### Production Environment Configuration
```typescript
const prodConfig = {
  workerLimit: 8,                    // Fully utilize multi-core
  restartWorker: true,               // Isolate test environments
  retryCount: 3,                     // More retries for better stability
  retryDelay: 5000,
  testTimeout: 120000,               // Longer timeout
  bail: false,                       // Execute all tests
  debug: false,
  logLevel: 'info',
  screenshots: 'afterError'
};
```

#### CI/CD Environment Configuration
```typescript
const ciConfig = {
  workerLimit: 2,                    // Limited resources
  retryCount: 1,                     // Reduce retries for faster execution
  retryDelay: 2000,
  testTimeout: 60000,
  bail: false,
  debug: false,
  logLevel: 'warn',
  screenshots: 'disable'             // No screenshots needed
};
```

## Plugin Hook System

TestRunController extends `PluggableModule` and provides rich plugin hooks:

### Lifecycle Hooks

#### beforeRun / afterRun
Triggered before and after the entire test queue execution:

```typescript
const controller = new TestRunController(config, testWorker);

// Preparation work before queue starts
controller.getHook('beforeRun')?.writeHook('setup', async (testQueue) => {
  console.log(`Preparing to execute ${testQueue.length} tests`);

  // Can modify test queue
  return testQueue.filter(test => !test.test.path.includes('skip'));
});

// Cleanup work after queue completion
controller.getHook('afterRun')?.readHook('cleanup', async (error) => {
  if (error) {
    console.error('Test queue execution failed:', error);
  } else {
    console.log('All tests execution completed');
  }

  // Perform cleanup work
  await cleanupTestEnvironment();
});
```

#### beforeTest / afterTest
Triggered before and after each test execution:

```typescript
// Preparation before test starts
controller.getHook('beforeTest')?.readHook('testSetup', async (queuedTest, workerMeta) => {
  console.log(`Starting execution: ${queuedTest.test.path} (process ${workerMeta.processID})`);

  // Record test start time
  queuedTest.startTime = Date.now();
});

// Processing after test completion
controller.getHook('afterTest')?.readHook('testTeardown', async (queuedTest, error, workerMeta) => {
  const duration = Date.now() - queuedTest.startTime;

  if (error) {
    console.error(`Test failed: ${queuedTest.test.path} (duration ${duration}ms)`);
    console.error('Error message:', error.message);

    // Save failure screenshot
    if (queuedTest.parameters.runData?.screenshotsEnabled) {
      await saveFailureScreenshot(queuedTest.test.path);
    }
  } else {
    console.log(`Test passed: ${queuedTest.test.path} (duration ${duration}ms)`);
  }
});
```

### Control Hooks

#### shouldNotExecute
Controls whether to execute the entire test queue:

```typescript
controller.getHook('shouldNotExecute')?.writeHook('environmentCheck', async (shouldSkip, testQueue) => {
  // Check if test environment is ready
  const environmentReady = await checkTestEnvironment();

  if (!environmentReady) {
    console.warn('Test environment not ready, skipping test execution');
    return true;  // Skip entire queue
  }

  return shouldSkip;
});
```

#### shouldNotStart
Controls whether a single test should start:

```typescript
controller.getHook('shouldNotStart')?.writeHook('testFilter', async (shouldSkip, queuedTest, workerMeta) => {
  // Skip specific tests based on conditions
  if (queuedTest.test.path.includes('performance') && process.env.SKIP_PERFORMANCE === 'true') {
    console.log(`Skipping performance test: ${queuedTest.test.path}`);
    return true;
  }

  // Check test dependencies
  const dependenciesAvailable = await checkTestDependencies(queuedTest.test);
  if (!dependenciesAvailable) {
    console.warn(`Skipping test (dependencies unavailable): ${queuedTest.test.path}`);
    return true;
  }

  return shouldSkip;
});
```

#### shouldNotRetry
Controls whether failed tests should be retried:

```typescript
controller.getHook('shouldNotRetry')?.writeHook('retryStrategy', async (shouldNotRetry, queuedTest, workerMeta) => {
  // Don't retry certain types of errors
  const lastError = queuedTest.retryErrors[queuedTest.retryErrors.length - 1];

  if (lastError?.message.includes('SYNTAX_ERROR')) {
    console.log(`Syntax error not retried: ${queuedTest.test.path}`);
    return true;  // Don't retry
  }

  if (lastError?.message.includes('TIMEOUT')) {
    // Add retry delay for timeout errors
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  return shouldNotRetry;
});
```

#### beforeTestRetry
Triggered before test retry:

```typescript
controller.getHook('beforeTestRetry')?.readHook('retryLogger', async (queuedTest, error, workerMeta) => {
  console.warn(`Test retry ${queuedTest.retryCount + 1}/${config.retryCount}: ${queuedTest.test.path}`);
  console.warn('Failure reason:', error.message);

  // Record retry metrics
  await recordRetryMetrics(queuedTest.test.path, queuedTest.retryCount, error);
});
```

## Advanced Usage

### Custom Test Queue Management

```typescript
class CustomTestRunController extends TestRunController {
  constructor(config, testWorker) {
    super(config, testWorker);

    // Register custom hooks
    this.setupCustomHooks();
  }

  private setupCustomHooks() {
    // Dynamic queue management
    this.getHook('beforeRun')?.writeHook('dynamicQueue', async (testQueue) => {
      // Reorder tests based on historical failure rates
      const sortedQueue = await this.sortTestsByFailureRate(testQueue);

      // Add smoke tests to the beginning of queue
      const smokeTests = await this.getSmokeTests();
      return [...smokeTests, ...sortedQueue];
    });

    // Intelligent retry strategy
    this.getHook('shouldNotRetry')?.writeHook('smartRetry', async (shouldNotRetry, queuedTest) => {
      const failurePattern = this.analyzeFailurePattern(queuedTest.retryErrors);

      // If it's a system-level error, wait for a while before retrying
      if (failurePattern === 'SYSTEM_ERROR') {
        await this.waitForSystemRecovery();
      }

      return shouldNotRetry;
    });
  }

  private async sortTestsByFailureRate(testQueue) {
    // Sort tests based on historical data
    const testHistory = await this.loadTestHistory();

    return testQueue.sort((a, b) => {
      const aFailureRate = testHistory[a.test.path]?.failureRate || 0;
      const bFailureRate = testHistory[b.test.path]?.failureRate || 0;

      // Execute tests with lower failure rates first
      return aFailureRate - bFailureRate;
    });
  }

  private async getSmokeTests() {
    // Get critical smoke tests
    return [
      { test: { path: './tests/smoke/basic.spec.js' }, retryCount: 0, retryErrors: [] }
    ];
  }

  private analyzeFailurePattern(errors) {
    // Analyze error patterns
    const errorMessages = errors.map(e => e.message).join(' ');

    if (errorMessages.includes('ECONNREFUSED') || errorMessages.includes('timeout')) {
      return 'NETWORK_ERROR';
    }

    if (errorMessages.includes('out of memory') || errorMessages.includes('heap')) {
      return 'MEMORY_ERROR';
    }

    return 'TEST_ERROR';
  }

  private async waitForSystemRecovery() {
    // Wait for system recovery
    console.log('System error detected, waiting for system recovery...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
```

### Test Reporting and Monitoring

```typescript
class TestReportingController extends TestRunController {
  private testResults = [];
  private startTime;

  constructor(config, testWorker) {
    super(config, testWorker);
    this.setupReporting();
  }

  private setupReporting() {
    // Record test start time
    this.getHook('beforeRun')?.readHook('startTimer', (testQueue) => {
      this.startTime = Date.now();
      console.log(`Starting test suite execution, ${testQueue.length} tests total`);
    });

    // Collect results for each test
    this.getHook('afterTest')?.readHook('collectResults', (queuedTest, error, workerMeta) => {
      const result = {
        testPath: queuedTest.test.path,
        status: error ? 'failed' : 'passed',
        duration: Date.now() - queuedTest.startTime,
        retryCount: queuedTest.retryCount,
        processID: workerMeta.processID,
        error: error ? error.message : null
      };

      this.testResults.push(result);
    });

    // Generate final report
    this.getHook('afterRun')?.readHook('generateReport', async (error) => {
      const totalDuration = Date.now() - this.startTime;
      const report = this.generateTestReport(totalDuration);

      // Save report
      await this.saveReport(report);

      // Send notification
      await this.sendNotification(report);
    });
  }

  private generateTestReport(totalDuration) {
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const totalRetries = this.testResults.reduce((sum, r) => sum + r.retryCount, 0);

    return {
      summary: {
        total: this.testResults.length,
        passed,
        failed,
        passRate: ((passed / this.testResults.length) * 100).toFixed(2) + '%',
        totalDuration,
        totalRetries
      },
      details: this.testResults,
      slowestTests: this.testResults
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      flakyTests: this.testResults
        .filter(r => r.retryCount > 0)
        .sort((a, b) => b.retryCount - a.retryCount)
    };
  }

  private async saveReport(report) {
    const reportPath = './test-reports/execution-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`Test report saved: ${reportPath}`);
  }

  private async sendNotification(report) {
    if (report.summary.failed > 0) {
      // Send failure notification
      await this.sendSlackNotification(`Test execution completed: ${report.summary.failed} tests failed`);
    }
  }
}
```

### Resource Management and Cleanup

```typescript
class ResourceManagedController extends TestRunController {
  private resources = new Map();

  async runQueue(testSet) {
    try {
      // Pre-allocate resources
      await this.allocateResources(testSet.length);

      return await super.runQueue(testSet);
    } finally {
      // Ensure resources are cleaned up
      await this.cleanupResources();
    }
  }

  async kill() {
    try {
      await super.kill();
    } finally {
      await this.cleanupResources();
    }
  }

  private async allocateResources(testCount) {
    // Allocate database connection pool
    const dbPool = await createDatabasePool(testCount);
    this.resources.set('database', dbPool);

    // Allocate temporary directory
    const tempDir = await createTempDirectory();
    this.resources.set('tempDir', tempDir);

    // Start test server
    const testServer = await startTestServer();
    this.resources.set('testServer', testServer);
  }

  private async cleanupResources() {
    for (const [name, resource] of this.resources) {
      try {
        await this.cleanupResource(name, resource);
      } catch (error) {
        console.error(`Resource cleanup failed ${name}:`, error);
      }
    }

    this.resources.clear();
  }

  private async cleanupResource(name, resource) {
    switch (name) {
      case 'database':
        await resource.end();
        break;
      case 'tempDir':
        await fs.rmdir(resource, { recursive: true });
        break;
      case 'testServer':
        await resource.close();
        break;
    }
  }
}
```

## Error Handling and Debugging

### Error Classification and Handling

```typescript
class ErrorHandlingController extends TestRunController {
  private errorClassifier = new ErrorClassifier();

  constructor(config, testWorker) {
    super(config, testWorker);
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.getHook('afterTest')?.readHook('errorHandler', async (queuedTest, error, workerMeta) => {
      if (error) {
        const errorType = this.errorClassifier.classify(error);

        switch (errorType) {
          case 'NETWORK_ERROR':
            await this.handleNetworkError(queuedTest, error);
            break;
          case 'MEMORY_ERROR':
            await this.handleMemoryError(workerMeta);
            break;
          case 'TEST_ERROR':
            await this.handleTestError(queuedTest, error);
            break;
          case 'SYSTEM_ERROR':
            await this.handleSystemError(error);
            break;
        }
      }
    });
  }

  private async handleNetworkError(queuedTest, error) {
    // Network error handling
    console.warn(`Network error in ${queuedTest.test.path}:`, error.message);

    // Check network connectivity
    const networkOk = await this.checkNetworkConnectivity();
    if (!networkOk) {
      throw new Error('Network connection unavailable, stopping test execution');
    }
  }

  private async handleMemoryError(workerMeta) {
    // Memory error handling
    console.error(`Worker process ${workerMeta.processID} out of memory`);

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Log memory usage
    const memUsage = process.memoryUsage();
    console.log('Memory usage:', memUsage);
  }

  private async handleTestError(queuedTest, error) {
    // Test logic error
    console.error(`Test logic error in ${queuedTest.test.path}:`, error.message);

    // Save error context
    await this.saveErrorContext(queuedTest, error);
  }

  private async handleSystemError(error) {
    // System-level error
    console.error('System-level error:', error.message);

    // Send alert
    await this.sendAlert('SYSTEM_ERROR', error);
  }
}

class ErrorClassifier {
  classify(error) {
    const message = error.message.toLowerCase();

    if (message.includes('econnrefused') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }

    if (message.includes('out of memory') || message.includes('heap')) {
      return 'MEMORY_ERROR';
    }

    if (message.includes('assertion') || message.includes('expect')) {
      return 'TEST_ERROR';
    }

    return 'SYSTEM_ERROR';
  }
}
```

### Debugging Tools

```typescript
class DebuggableController extends TestRunController {
  private debugMode: boolean;
  private executionTrace = [];

  constructor(config, testWorker) {
    super(config, testWorker);
    this.debugMode = config.debug || false;

    if (this.debugMode) {
      this.setupDebugHooks();
    }
  }

  private setupDebugHooks() {
    // Track all hook calls
    const originalCallHook = this.callHook.bind(this);
    this.callHook = async (hookName, ...args) => {
      const startTime = Date.now();

      this.trace(`Hook called: ${hookName}`, args);

      try {
        const result = await originalCallHook(hookName, ...args);
        const duration = Date.now() - startTime;

        this.trace(`Hook completed: ${hookName} (${duration}ms)`, result);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.trace(`Hook failed: ${hookName} (${duration}ms)`, error);
        throw error;
      }
    };

    // Record test execution status
    this.getHook('beforeTest')?.readHook('debugTrace', (queuedTest, workerMeta) => {
      this.trace('Test started', {
        test: queuedTest.test.path,
        worker: workerMeta.processID,
        retryCount: queuedTest.retryCount
      });
    });

    this.getHook('afterTest')?.readHook('debugTrace', (queuedTest, error, workerMeta) => {
      this.trace('Test completed', {
        test: queuedTest.test.path,
        worker: workerMeta.processID,
        success: !error,
        error: error?.message
      });
    });
  }

  private trace(message, data) {
    const traceEntry = {
      timestamp: Date.now(),
      message,
      data
    };

    this.executionTrace.push(traceEntry);

    if (this.debugMode) {
      console.log(`[DEBUG] ${message}:`, data);
    }
  }

  getExecutionTrace() {
    return this.executionTrace;
  }

  async saveExecutionTrace() {
    if (this.executionTrace.length > 0) {
      const tracePath = './debug/execution-trace.json';
      await fs.writeFile(tracePath, JSON.stringify(this.executionTrace, null, 2));
      console.log(`Execution trace saved: ${tracePath}`);
    }
  }
}
```

## Performance Optimization

### Intelligent Load Balancing

```typescript
class LoadBalancedController extends TestRunController {
  private workerStats = new Map();

  private createWorkers(limit) {
    const workers = super.createWorkers(limit);

    // Initialize worker process statistics
    workers.forEach((worker, index) => {
      this.workerStats.set(worker.getWorkerID(), {
        testsExecuted: 0,
        totalDuration: 0,
        averageDuration: 0,
        currentTest: null,
        lastActivityTime: Date.now()
      });
    });

    return workers;
  }

  private async executeWorker(worker, queue) {
    const workerId = worker.getWorkerID();
    const stats = this.workerStats.get(workerId);

    // Update worker process status
    stats.lastActivityTime = Date.now();

    const queuedTest = queue.shift();
    if (!queuedTest) return;

    stats.currentTest = queuedTest.test.path;

    const startTime = Date.now();

    try {
      await super.executeWorker(worker, queue);

      // Update success statistics
      const duration = Date.now() - startTime;
      stats.testsExecuted++;
      stats.totalDuration += duration;
      stats.averageDuration = stats.totalDuration / stats.testsExecuted;

    } finally {
      stats.currentTest = null;
      stats.lastActivityTime = Date.now();
    }
  }

  getWorkerStatistics() {
    const stats = {};

    for (const [workerId, data] of this.workerStats) {
      stats[workerId] = {
        ...data,
        efficiency: data.averageDuration > 0 ? 1000 / data.averageDuration : 0
      };
    }

    return stats;
  }
}
```

### Memory Management

```typescript
class MemoryOptimizedController extends TestRunController {
  private memoryThreshold = 500 * 1024 * 1024; // 500MB
  private gcInterval;

  async runQueue(testSet) {
    // Start memory monitoring
    this.startMemoryMonitoring();

    try {
      return await super.runQueue(testSet);
    } finally {
      this.stopMemoryMonitoring();
    }
  }

  private startMemoryMonitoring() {
    this.gcInterval = setInterval(() => {
      const memUsage = process.memoryUsage();

      if (memUsage.heapUsed > this.memoryThreshold) {
        console.warn(`High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);

        // Force garbage collection
        if (global.gc) {
          global.gc();
          console.log('Garbage collection executed');
        }
      }
    }, 5000);
  }

  private stopMemoryMonitoring() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }
  }
}
```

## Best Practices

### 1. Configuration Optimization
- Set `workerLimit` appropriately based on hardware resources
- Use `'local'` mode in development environment for easier debugging
- Set appropriate retry count and delay time
- Adjust timeout based on test complexity

### 2. Plugin Usage
- Use plugin hooks to implement custom logic
- Keep plugins lightweight and independent
- Implement proper error handling in plugins
- Use read hooks for monitoring and logging

### 3. Error Handling
- Implement comprehensive error classification and handling strategies
- Provide detailed error information and context
- Use retry mechanisms for transient errors
- Establish error monitoring and alerting mechanisms

### 4. Performance Optimization
- Monitor resource usage of worker processes
- Implement intelligent load balancing strategies
- Perform regular memory management and garbage collection
- Optimize test queue scheduling algorithms

### 5. Debugging and Monitoring
- Enable detailed debug logs in development environment
- Collect and analyze test execution data
- Build comprehensive test reporting systems
- Implement real-time execution status monitoring

## Troubleshooting

### Common Issues

#### Worker Process Creation Failed
```bash
Error: Failed to create a test worker instance
```
Solution: Check system resources and confirm TestWorker configuration is correct.

#### Test Timeout
```bash
Error: Test timeout exceeded 30000ms
```
Solution: Increase `testTimeout` configuration or optimize test code.

#### Out of Memory
```bash
Error: out of memory
```
Solution: Reduce `workerLimit` or increase system memory.

### Debugging Tips

```typescript
// Enable detailed debugging
const config = {
  debug: true,
  logLevel: 'debug',
  workerLimit: 1  // Single process for easier debugging
};

// Add debug hooks
controller.getHook('beforeTest')?.readHook('debug', (queuedTest) => {
  console.log('Debug info:', queuedTest);
});
```

## Dependencies

- `@testring/pluggable-module` - Plugin system foundation
- `@testring/logger` - Logging
- `@testring/utils` - Utility functions
- `@testring/types` - Type definitions
- `@testring/fs-store` - File storage

## Related Modules

- `@testring/test-worker` - Test worker process
- `@testring/cli` - Command line interface
- `@testring/plugin-api` - Plugin API

## License

MIT License

