# @testring/test-utils

Test utilities module that serves as the testing assistance core for the testring framework, providing comprehensive test mock objects, file operation tools, and unit testing support capabilities. This module integrates transport layer mocking, test worker simulation, browser proxy mocking, and file system operation tools, delivering a complete solution for test development and test automation.

[![npm version](https://badge.fury.io/js/@testring/test-utils.svg)](https://www.npmjs.com/package/@testring/test-utils)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The test utilities module is the testing assistance core of the testring framework, providing:

- **Complete transport layer mocking** with message communication simulation
- **Intelligent test worker simulation** with lifecycle management
- **Comprehensive browser proxy controller mocking** for browser automation testing
- **Efficient file system operations** and path resolution tools
- **Plugin compatibility testing tools (PluginCompatibilityTester)** for browser driver validation
- **Complete unit test suite and integration tests** with comprehensive coverage
- **Type-safe TypeScript support** with interface definitions
- **Flexible test scenario configuration** with mock parameters
- **Concurrency safety and error handling** mechanisms
- **Object-oriented mock design** with extensible architecture

## Key Features

### 🚌 Transport Layer Mocking
- Complete ITransport interface implementation and simulation
- Support for various message types and transport modes
- Event-driven message processing and listening mechanisms
- Multi-process inter-communication mocking and testing support

### 👷 Test Worker Simulation
- Complete test worker lifecycle simulation
- Configurable execution delays and failure scenarios
- Detailed execution statistics and state tracking
- Concurrent execution and resource management simulation

### 🌐 Browser Proxy Mocking
- Complete browser proxy controller simulation
- Support for various browser operations and event simulation
- Flexible test scenario configuration with mock parameters
- Error injection and exception scenario testing support

### 📁 File System Tools
- Efficient file reading and path resolution utilities
- Support for asynchronous file operations with error handling
- Flexible path configuration with relative path support
- Cross-platform compatibility and encoding support

### 🔌 Plugin Compatibility Testing
- **PluginCompatibilityTester** - Browser proxy plugin compatibility testing tool
- Support for Selenium and Playwright driver compatibility testing
- Complete IBrowserProxyPlugin interface method verification
- Configurable test skipping and custom timeout settings
- Detailed test result reporting and error handling

### 🧪 Unit Test Suite
- **Complete unit test coverage** - Including all core functionality unit tests
- **Integration test examples** - Demonstrating how to use test utilities
- **Usage examples and documentation** - Detailed usage patterns and best practices
- **Mock toolkit** - Reusable mock objects and testing helper tools

## Installation

```bash
# Using npm
npm install --save-dev @testring/test-utils

# Using yarn
yarn add --dev @testring/test-utils

# Using pnpm
pnpm add --save-dev @testring/test-utils
```

## Core Architecture

### TransportMock Class

Transport layer mock implementation, extending `EventEmitter`:

```typescript
class TransportMock extends EventEmitter implements ITransport {
  // Message Broadcasting Methods
  public broadcast<T>(messageType: string, payload: T): void
  public broadcastFrom<T>(messageType: string, payload: T, processID: string): void
  public broadcastLocal<T>(messageType: string, payload: T): void
  public broadcastUniversally<T>(messageType: string, payload: T): void

  // Message Sending and Listening
  public send<T>(src: string, messageType: string, payload: T): Promise<void>
  public on<T>(messageType: string, callback: (m: T, source?: string) => void): Function
  public once<T>(messageType: string, callback: (m: T, source?: string) => void): Function
  public onceFrom<T>(processID: string, messageType: string, callback: Function): Function

  // Process Management
  public registerChild(processID: string, process: IWorkerEmitter): void
  public isChildProcess(): boolean
}
```

### TestWorkerMock Class

Test worker mock implementation:

```typescript
class TestWorkerMock implements ITestWorker {
  constructor(
    shouldFail?: boolean,     // Whether to simulate failure
    executionDelay?: number   // Execution delay time
  )

  // Core Methods
  public spawn(): ITestWorkerInstance

  // Mock Control Methods
  public $getSpawnedCount(): number
  public $getKillCallsCount(): number
  public $getExecutionCallsCount(): number
  public $getInstanceName(): string
  public $getErrorInstance(): any
}

class TestWorkerMockInstance implements ITestWorkerInstance {
  public getWorkerID(): string
  public execute(): Promise<void>
  public kill(): Promise<void>

  // Test State Queries
  public $getKillCallsCount(): number
  public $getExecuteCallsCount(): number
  public $getErrorInstance(): any
}
```

### File Utility Functions

```typescript
// File Path Resolution Factory
function fileResolverFactory(...root: string[]): (...file: string[]) => string

// File Reading Factory
function fileReaderFactory(...root: string[]): (source: string) => Promise<string>
```

### PluginCompatibilityTester Class

Browser plugin compatibility testing tool:

```typescript
class PluginCompatibilityTester {
  constructor(
    plugin: IBrowserProxyPlugin,
    config?: CompatibilityTestConfig
  )

  // Test Methods
  public testMethodImplementation(): Promise<void>
  public testBasicNavigation(): Promise<void>
  public testElementQueries(): Promise<void>
  public testFormInteractions(): Promise<void>
  public testJavaScriptExecution(): Promise<void>
  public testScreenshots(): Promise<void>
  public testWaitOperations(): Promise<void>
  public testSessionManagement(): Promise<void>
  public testErrorHandling(): Promise<void>

  // Run All Tests
  public runAllTests(): Promise<{
    passed: number;
    failed: number;
    skipped: number;
    results: Array<{
      name: string;
      status: 'passed' | 'failed' | 'skipped';
      error?: Error;
    }>;
  }>
}

interface CompatibilityTestConfig {
  pluginName?: string;
  skipTests?: string[];
  customTimeouts?: {
    waitForExist?: number;
    waitForVisible?: number;
    executeAsync?: number;
    [key: string]: number | undefined;
  };
}
```

## 基本用法

### 传输层模拟使用

```typescript
import { TransportMock } from '@testring/test-utils';

// 创建传输层模拟
const transportMock = new TransportMock();

// 监听消息
transportMock.on('test.start', (payload, source) => {
  console.log('测试开始:', payload, '来源:', source);
});

transportMock.on('test.complete', (payload) => {
  console.log('测试完成:', payload);
});

// 测试消息广播
transportMock.broadcast('test.start', {
  testName: 'example-test',
  timestamp: Date.now()
});

// 测试指向消息
transportMock.send('worker-1', 'test.execute', {
  testFile: './test/example.test.js'
});

// 测试来源消息
transportMock.broadcastFrom('test.result', {
  success: true,
  duration: 1500
}, 'worker-1');

// 清理监听器
const removeListener = transportMock.on('test.error', (error) => {
  console.error('测试错误:', error);
});

// 移除监听器
removeListener();

// 单次监听
transportMock.once('test.finish', () => {
  console.log('测试结束（仅触发一次）');
});

// 来源特定监听
transportMock.onceFrom('worker-2', 'test.status', (status) => {
  console.log('工作器 2 状态:', status);
});
```

### 测试工作器模拟使用

```typescript
import { TestWorkerMock } from '@testring/test-utils';

// 创建成功的测试工作器模拟
const successWorker = new TestWorkerMock(false, 1000); // 不失败，1秒延迟

// 创建失败的测试工作器模拟
const failingWorker = new TestWorkerMock(true, 500); // 失败，0.5秒延迟

// 创建即时测试工作器模拟
const instantWorker = new TestWorkerMock(false, 0); // 不失败，无延迟

// 生成工作器实例
const worker1 = successWorker.spawn();
const worker2 = failingWorker.spawn();
const worker3 = instantWorker.spawn();

console.log('工作器 ID:', worker1.getWorkerID());

// 测试成功执行
async function testSuccessfulExecution() {
  try {
    console.log('开始执行成功测试...');
    await worker1.execute();
    console.log('测试执行成功');
  } catch (error) {
    console.error('测试执行失败:', error);
  }
}

// 测试失败执行
async function testFailedExecution() {
  try {
    console.log('开始执行失败测试...');
    await worker2.execute();
    console.log('意外成功！');
  } catch (error) {
    console.log('按预期失败:', error);
  }
}

// 测试工作器管理
async function testWorkerManagement() {
  // 执行多个任务
  await worker1.execute();
  await worker3.execute();
  
  // 查看统计信息
  console.log('生成实例数:', successWorker.$getSpawnedCount());
  console.log('执行次数:', successWorker.$getExecutionCallsCount());
  console.log('终止次数:', successWorker.$getKillCallsCount());
  
  // 终止工作器
  await worker1.kill();
  await worker3.kill();
  
  console.log('终止后统计:', successWorker.$getKillCallsCount());
}

// 执行测试
testSuccessfulExecution();
testFailedExecution();
testWorkerManagement();
```

### 文件系统工具使用

```typescript
import { fileReaderFactory, fileResolverFactory } from '@testring/test-utils';
import * as path from 'path';

// 创建路径解析器
const resolveProjectPath = fileResolverFactory(__dirname, '..');
const resolveTestPath = fileResolverFactory(__dirname, '../test');
const resolveSrcPath = fileResolverFactory(__dirname, '../src');

// 使用路径解析器
const configPath = resolveProjectPath('tsconfig.json');
const testFile = resolveTestPath('example.test.ts');
const sourceFile = resolveSrcPath('index.ts');

console.log('配置文件路径:', configPath);
console.log('测试文件路径:', testFile);
console.log('源码文件路径:', sourceFile);

// 创建文件读取器
const readProjectFile = fileReaderFactory(__dirname, '..');
const readTestFile = fileReaderFactory(__dirname, '../test');
const readSourceFile = fileReaderFactory(__dirname, '../src');

// 使用文件读取器
async function readFiles() {
  try {
    // 读取配置文件
    const packageJson = await readProjectFile('package.json');
    console.log('package.json 内容长度:', packageJson.length);
    
    // 读取测试文件
    const testContent = await readTestFile('example.test.ts');
    console.log('测试文件内容长度:', testContent.length);
    
    // 读取源码文件
    const sourceContent = await readSourceFile('index.ts');
    console.log('源码文件内容长度:', sourceContent.length);
    
  } catch (error) {
    console.error('文件读取失败:', error.message);
  }
}

// 批量读取文件
async function readMultipleFiles() {
  const files = [
    'package.json',
    'tsconfig.json',
    'README.md'
  ];
  
  const results = await Promise.allSettled(
    files.map(file => readProjectFile(file))
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`${files[index]}: 读取成功，长度 ${result.value.length}`);
    } else {
      console.log(`${files[index]}: 读取失败 - ${result.reason.message}`);
    }
  });
}

readFiles();
readMultipleFiles();
```

## 高级用法和模式

### 集成测试环境搭建

```typescript
import { TransportMock, TestWorkerMock, fileReaderFactory } from '@testring/test-utils';

// 集成测试环境类
class IntegratedTestEnvironment {
  public transport: TransportMock;
  public workers: Map<string, TestWorkerMock>;
  public fileReader: (source: string) => Promise<string>;
  private messageHistory: Array<{ type: string; payload: any; timestamp: number }> = [];
  
  constructor(projectRoot: string = process.cwd()) {
    this.transport = new TransportMock();
    this.workers = new Map();
    this.fileReader = fileReaderFactory(projectRoot);
    
    this.setupMessageLogging();
  }
  
  // 设置消息日志
  private setupMessageLogging() {
    const originalBroadcast = this.transport.broadcast.bind(this.transport);
    
    this.transport.broadcast = <T>(messageType: string, payload: T) => {
      this.messageHistory.push({
        type: messageType,
        payload,
        timestamp: Date.now()
      });
      
      return originalBroadcast(messageType, payload);
    };
  }
  
  // 创建测试工作器
  createTestWorker(name: string, shouldFail = false, delay = 0): TestWorkerMock {
    const worker = new TestWorkerMock(shouldFail, delay);
    this.workers.set(name, worker);
    return worker;
  }
  
  // 获取测试工作器
  getTestWorker(name: string): TestWorkerMock | undefined {
    return this.workers.get(name);
  }
  
  // 批量创建工作器
  createMultipleWorkers(configs: Array<{
    name: string;
    shouldFail?: boolean;
    delay?: number;
  }>): Map<string, TestWorkerMock> {
    configs.forEach(config => {
      this.createTestWorker(config.name, config.shouldFail, config.delay);
    });
    
    return this.workers;
  }
  
  // 模拟测试执行流程
  async simulateTestExecution(workerName: string, testFiles: string[]) {
    const worker = this.getTestWorker(workerName);
    if (!worker) {
      throw new Error(`工作器 '${workerName}' 不存在`);
    }
    
    // 广播测试开始
    this.transport.broadcast('test.session.start', {
      workerName,
      testFiles,
      timestamp: Date.now()
    });
    
    const results = [];
    
    for (const testFile of testFiles) {
      // 广播测试文件开始
      this.transport.broadcast('test.file.start', {
        workerName,
        testFile,
        timestamp: Date.now()
      });
      
      try {
        // 生成工作器实例并执行
        const instance = worker.spawn();
        await instance.execute();
        
        results.push({ testFile, success: true, error: null });
        
        // 广播测试文件成功
        this.transport.broadcast('test.file.success', {
          workerName,
          testFile,
          timestamp: Date.now()
        });
        
      } catch (error) {
        results.push({ testFile, success: false, error });
        
        // 广播测试文件失败
        this.transport.broadcast('test.file.failure', {
          workerName,
          testFile,
          error: error.toString(),
          timestamp: Date.now()
        });
      }
    }
    
    // 广播测试会话结束
    this.transport.broadcast('test.session.complete', {
      workerName,
      results,
      timestamp: Date.now()
    });
    
    return results;
  }
  
  // 获取测试统计
  getTestStatistics() {
    const stats = {
      totalWorkers: this.workers.size,
      totalSpawned: 0,
      totalExecutions: 0,
      totalKills: 0,
      messageCount: this.messageHistory.length
    };
    
    this.workers.forEach(worker => {
      stats.totalSpawned += worker.$getSpawnedCount();
      stats.totalExecutions += worker.$getExecutionCallsCount();
      stats.totalKills += worker.$getKillCallsCount();
    });
    
    return stats;
  }
  
  // 获取消息历史
  getMessageHistory(messageType?: string) {
    if (messageType) {
      return this.messageHistory.filter(msg => msg.type === messageType);
    }
    return [...this.messageHistory];
  }
  
  // 清理环境
  async cleanup() {
    // 终止所有工作器
    for (const [name, worker] of this.workers) {
      for (let i = 0; i < worker.$getSpawnedCount(); i++) {
        const instance = worker.spawn();
        await instance.kill();
      }
    }
    
    // 清理消息历史
    this.messageHistory = [];
    
    // 清理传输层监听器
    this.transport.removeAllListeners();
    
    console.log('测试环境已清理');
  }
}

// 使用集成测试环境
async function runIntegratedTest() {
  const testEnv = new IntegratedTestEnvironment();
  
  // 监听测试事件
  testEnv.transport.on('test.session.start', (data) => {
    console.log('测试会话开始:', data);
  });
  
  testEnv.transport.on('test.file.success', (data) => {
    console.log('测试文件成功:', data.testFile);
  });
  
  testEnv.transport.on('test.file.failure', (data) => {
    console.log('测试文件失败:', data.testFile, data.error);
  });
  
  // 创建工作器
  testEnv.createMultipleWorkers([
    { name: 'unit-tests', shouldFail: false, delay: 100 },
    { name: 'integration-tests', shouldFail: false, delay: 500 },
    { name: 'e2e-tests', shouldFail: true, delay: 1000 }
  ]);
  
  try {
    // 模拟测试执行
    await testEnv.simulateTestExecution('unit-tests', [
      'unit/parser.test.js',
      'unit/validator.test.js'
    ]);
    
    await testEnv.simulateTestExecution('integration-tests', [
      'integration/api.test.js'
    ]);
    
    await testEnv.simulateTestExecution('e2e-tests', [
      'e2e/user-flow.test.js'
    ]);
    
    // 输出统计信息
    const stats = testEnv.getTestStatistics();
    console.log('测试统计:', stats);
    
    // 输出消息历史
    const messages = testEnv.getMessageHistory();
    console.log(`共产生 ${messages.length} 条消息`);
    
  } finally {
    await testEnv.cleanup();
  }
}

runIntegratedTest().catch(console.error);
```

### 高级测试场景模拟

```typescript
// 复杂测试场景模拟器
class AdvancedTestScenarios {
  private testEnv: IntegratedTestEnvironment;
  
  constructor() {
    this.testEnv = new IntegratedTestEnvironment();
  }
  
  // 模拟并发测试执行
  async simulateConcurrentExecution() {
    console.log('开始并发测试模拟...');
    
    // 创建多个工作器
    this.testEnv.createMultipleWorkers([
      { name: 'worker-1', shouldFail: false, delay: 200 },
      { name: 'worker-2', shouldFail: false, delay: 300 },
      { name: 'worker-3', shouldFail: true, delay: 150 }
    ]);
    
    // 并发执行测试
    const concurrentTasks = [
      this.testEnv.simulateTestExecution('worker-1', ['test1.js', 'test2.js']),
      this.testEnv.simulateTestExecution('worker-2', ['test3.js']),
      this.testEnv.simulateTestExecution('worker-3', ['test4.js', 'test5.js'])
    ];
    
    const results = await Promise.allSettled(concurrentTasks);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`工作器 ${index + 1} 执行成功:`, result.value);
      } else {
        console.log(`工作器 ${index + 1} 执行失败:`, result.reason);
      }
    });
  }
  
  // 模拟网络延迟和重试
  async simulateNetworkIssues() {
    console.log('模拟网络问题场景...');
    
    const unstableWorker = this.testEnv.createTestWorker('unstable', false, 0);
    
    // 模拟不稳定的网络环境
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`第 ${attempt} 次尝试...`);
        
        // 随机延迟模拟网络抖动
        const delay = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const instance = unstableWorker.spawn();
        await instance.execute();
        
        console.log(`第 ${attempt} 次尝试成功`);
        break;
        
      } catch (error) {
        console.log(`第 ${attempt} 次尝试失败:`, error.message);
        
        if (attempt === 3) {
          console.log('所有重试均失败');
        } else {
          // 指数退避重试
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
  }
  
  // 模拟资源限制场景
  async simulateResourceConstraints() {
    console.log('模拟资源限制场景...');
    
    const maxConcurrentWorkers = 3;
    const totalTasks = 10;
    
    // 创建有限的工作器集
    const workers = [];
    for (let i = 0; i < maxConcurrentWorkers; i++) {
      workers.push(this.testEnv.createTestWorker(`limited-worker-${i}`, false, 100));
    }
    
    // 模拟任务队列
    const taskQueue = [];
    for (let i = 0; i < totalTasks; i++) {
      taskQueue.push({
        id: i,
        testFile: `task-${i}.test.js`
      });
    }
    
    // 限流执行任务
    const executingTasks = new Set();
    const completedTasks = [];
    
    while (taskQueue.length > 0 || executingTasks.size > 0) {
      // 启动新任务
      while (executingTasks.size < maxConcurrentWorkers && taskQueue.length > 0) {
        const task = taskQueue.shift()!;
        const workerIndex = executingTasks.size;
        const worker = workers[workerIndex];
        
        const execution = this.executeTask(worker, task)
          .then(result => {
            completedTasks.push(result);
            executingTasks.delete(execution);
          })
          .catch(error => {
            console.error(`任务 ${task.id} 失败:`, error.message);
            executingTasks.delete(execution);
          });
        
        executingTasks.add(execution);
      }
      
      // 等待至少一个任务完成
      if (executingTasks.size > 0) {
        await Promise.race(Array.from(executingTasks));
      }
    }
    
    console.log(`所有任务完成，成功: ${completedTasks.length}/${totalTasks}`);
  }
  
  private async executeTask(worker: TestWorkerMock, task: any) {
    console.log(`开始执行任务 ${task.id}`);
    const instance = worker.spawn();
    await instance.execute();
    console.log(`任务 ${task.id} 完成`);
    return { taskId: task.id, success: true };
  }
  
  // 清理资源
  async cleanup() {
    await this.testEnv.cleanup();
  }
}

// 运行高级测试场景
async function runAdvancedScenarios() {
  const scenarios = new AdvancedTestScenarios();
  
  try {
    await scenarios.simulateConcurrentExecution();
    console.log('\n--- 分割线 ---\n');
    
    await scenarios.simulateNetworkIssues();
    console.log('\n--- 分割线 ---\n');
    
    await scenarios.simulateResourceConstraints();
    
  } finally {
    await scenarios.cleanup();
  }
}

runAdvancedScenarios().catch(console.error);
```

## PluginCompatibilityTester 使用指南

### 基本用法

```typescript
import { PluginCompatibilityTester, CompatibilityTestConfig } from '../../../test-utils/plugin-compatibility-tester';

// 配置兼容性测试
const config: CompatibilityTestConfig = {
    pluginName: 'my-browser-plugin',
    skipTests: ['screenshots'], // 可选：跳过特定测试
    customTimeouts: {           // 可选：自定义超时设置
        waitForExist: 10000,
        waitForVisible: 8000
    }
};

// 创建测试器实例
const tester = new PluginCompatibilityTester(plugin, config);

// 运行单个测试方法
await tester.testMethodImplementation();
await tester.testBasicNavigation();
await tester.testElementQueries();

// 或运行所有测试
const results = await tester.runAllTests();
console.log(`通过: ${results.passed}, 失败: ${results.failed}, 跳过: ${results.skipped}`);
```

### 可用的测试方法

- `testMethodImplementation()` - 验证所有必需的 IBrowserProxyPlugin 方法已实现
- `testBasicNavigation()` - 测试 URL 导航、页面标题、刷新和源码获取
- `testElementQueries()` - 测试元素存在性和可见性检查
- `testFormInteractions()` - 测试表单输入操作
- `testJavaScriptExecution()` - 测试 JavaScript 执行能力
- `testScreenshots()` - 测试截图功能
- `testWaitOperations()` - 测试等待操作
- `testSessionManagement()` - 测试多会话处理
- `testErrorHandling()` - 测试错误场景

### 配置选项

#### skipTests 跳过测试
测试名称应为小写且无空格的格式：
```typescript
skipTests: [
    'methodimplementation',  // 跳过方法实现测试
    'basicnavigation',       // 跳过基本导航测试
    'elementqueries',        // 跳过元素查询测试
    'forminteractions',      // 跳过表单交互测试
    'javascriptexecution',   // 跳过 JavaScript 执行测试
    'screenshots',           // 跳过截图测试
    'waitoperations',        // 跳过等待操作测试
    'sessionmanagement',     // 跳过会话管理测试
    'errorhandling'          // 跳过错误处理测试
]
```

#### customTimeouts 自定义超时
```typescript
customTimeouts: {
    waitForExist: 10000,     // 元素存在等待超时（毫秒）
    waitForVisible: 8000,    // 元素可见等待超时（毫秒）
    executeAsync: 15000      // 异步执行超时（毫秒）
}
```

## 单元测试

本包现在包含了 PluginCompatibilityTester 的完整单元测试：

### 测试文件结构

```
test/
├── plugin-compatibility-tester.spec.ts      # PluginCompatibilityTester 类的单元测试
├── plugin-compatibility-integration.spec.ts # 使用 PluginCompatibilityTester 的集成测试
├── plugin-compatibility-usage.spec.ts       # 使用示例和文档测试
├── mocks/
│   └── browser-proxy-plugin.mock.ts         # 测试用的模拟实现
└── setup.ts                                 # 测试环境设置
```

### 运行测试

```bash
# 仅运行此包的测试
cd packages/test-utils
npm test

# 运行所有项目测试（包含此包）
npm run test
```

### 测试覆盖范围

单元测试覆盖了：
- 构造函数和配置处理
- 各个测试方法的功能
- 错误处理场景
- 跳过测试功能
- 与实际插件实现的集成
- 使用模式和示例

## 迁移说明

原始的 `test-utils/plugin-compatibility-tester.ts` 文件已转换为适当的单元测试。功能保持不变，但现在已经过适当测试并集成到项目的测试套件中。

### 变更内容

1. **添加了单元测试** - PluginCompatibilityTester 类的全面单元测试
2. **添加了集成测试** - 演示如何与实际插件一起使用 PluginCompatibilityTester 的测试
3. **添加了模拟工具** - 用于测试的可重用模拟实现
4. **更新了包配置** - 添加了测试脚本和依赖项
5. **与项目测试集成** - 测试现在作为 `npm run test` 的一部分运行

### 保持不变的内容

- PluginCompatibilityTester 类 API 保持不变
- 所有测试方法的工作方式完全相同
- 配置选项完全相同
- 原始文件位置 (`test-utils/plugin-compatibility-tester.ts`) 得到保留

## API Reference

### TransportMock

```typescript
class TransportMock extends EventEmitter implements ITransport {
  // Constructor
  constructor()

  // Broadcasting Methods
  broadcast<T>(messageType: string, payload: T): void
  broadcastFrom<T>(messageType: string, payload: T, processID: string): void
  broadcastLocal<T>(messageType: string, payload: T): void
  broadcastUniversally<T>(messageType: string, payload: T): void

  // Message Sending
  send<T>(src: string, messageType: string, payload: T): Promise<void>

  // Event Listeners
  on<T>(messageType: string, callback: (m: T, source?: string) => void): Function
  once<T>(messageType: string, callback: (m: T, source?: string) => void): Function
  onceFrom<T>(processID: string, messageType: string, callback: Function): Function

  // Process Management
  registerChild(processID: string, process: IWorkerEmitter): void
  isChildProcess(): boolean
}
```

### TestWorkerMock

```typescript
class TestWorkerMock implements ITestWorker {
  // Constructor
  constructor(shouldFail?: boolean, executionDelay?: number)

  // Core Methods
  spawn(): ITestWorkerInstance

  // Mock Control Methods
  $getSpawnedCount(): number
  $getKillCallsCount(): number
  $getExecutionCallsCount(): number
  $getInstanceName(): string
  $getErrorInstance(): any
}

class TestWorkerMockInstance implements ITestWorkerInstance {
  // Core Methods
  getWorkerID(): string
  execute(): Promise<void>
  kill(): Promise<void>

  // Mock Control Methods
  $getKillCallsCount(): number
  $getExecuteCallsCount(): number
  $getErrorInstance(): any
}
```

### File Utilities

```typescript
// File Path Resolution Factory
function fileResolverFactory(...root: string[]): (...file: string[]) => string

// File Reading Factory
function fileReaderFactory(...root: string[]): (source: string) => Promise<string>
```

### PluginCompatibilityTester

```typescript
class PluginCompatibilityTester {
  // Constructor
  constructor(plugin: IBrowserProxyPlugin, config?: CompatibilityTestConfig)

  // Individual Test Methods
  testMethodImplementation(): Promise<void>
  testBasicNavigation(): Promise<void>
  testElementQueries(): Promise<void>
  testFormInteractions(): Promise<void>
  testJavaScriptExecution(): Promise<void>
  testScreenshots(): Promise<void>
  testWaitOperations(): Promise<void>
  testSessionManagement(): Promise<void>
  testErrorHandling(): Promise<void>

  // Run All Tests
  runAllTests(): Promise<{
    passed: number;
    failed: number;
    skipped: number;
    results: Array<{
      name: string;
      status: 'passed' | 'failed' | 'skipped';
      error?: Error;
    }>;
  }>
}

interface CompatibilityTestConfig {
  pluginName?: string;
  skipTests?: string[];
  customTimeouts?: {
    waitForExist?: number;
    waitForVisible?: number;
    executeAsync?: number;
    [key: string]: number | undefined;
  };
}
```

## Best Practices

### 1. Mock Design
- **Use real interface implementations** rather than simple stubs
- **Provide configurable mock behavior** and parameters
- **Implement error injection** and exception scenario testing
- **Simulate realistic time delays** and network conditions

### 2. Test Isolation
- **Ensure independence and repeatability** between tests
- **Clean up test resources and state** promptly
- **Avoid global state** and cross-test dependencies
- **Use appropriate cleanup and reset mechanisms**

### 3. Performance Considerations
- **Use mock objects judiciously** to avoid memory leaks
- **Optimize file operations** and I/O performance
- **Control concurrent test count** and resource usage
- **Monitor test execution time** and resource consumption

### 4. Error Handling
- **Provide clear error messages** and debugging information
- **Implement appropriate error recovery** and retry mechanisms
- **Distinguish between mock errors** and actual test errors
- **Log detailed error information** and context

### 5. Maintainability
- **Provide clear API documentation** and usage examples
- **Use descriptive naming** and comments
- **Implement introspection** and debugging support for mock state
- **Provide version compatibility** and upgrade guides

## Troubleshooting

### Common Issues

#### Mock Object Not Working
```bash
Error: Mock method not implemented
```
**Solution**: Check mock object interface implementation, method calls, and type matching.

#### File Reading Failure
```bash
ENOENT: no such file or directory
```
**Solution**: Check file paths, working directory, file permissions, and path resolution.

#### Memory Leaks
```bash
MaxListenersExceededWarning
```
**Solution**: Check event listener cleanup, object disposal, and memory management.

#### Concurrency Issues
```bash
Race condition in test execution
```
**Solution**: Check concurrency control, state management, and asynchronous operation synchronization.

### Debugging Tips

```typescript
// Enable verbose logging
const transportMock = new TransportMock();

// Listen to all messages
transportMock.on('*', (payload, source) => {
  console.log('Message event:', { payload, source });
});

// Check mock state
const worker = new TestWorkerMock(false, 100);
console.log('Worker statistics:', {
  spawned: worker.$getSpawnedCount(),
  executions: worker.$getExecutionCallsCount(),
  kills: worker.$getKillCallsCount()
});

// File reading debugging
const readFile = fileReaderFactory(__dirname);
readFile('test.txt')
  .then(content => console.log('File content:', content))
  .catch(error => console.error('Reading error:', error));
```

## Integration with Testing Frameworks

### Jest Integration

```typescript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['./test/setup.js']
};

// test/setup.js
const { TransportMock, TestWorkerMock } = require('@testring/test-utils');

// Make mocks available globally
global.TransportMock = TransportMock;
global.TestWorkerMock = TestWorkerMock;

// Setup before each test
beforeEach(() => {
  global.transportMock = new TransportMock();
});

// Cleanup after each test
afterEach(() => {
  global.transportMock.removeAllListeners();
});
```

### Mocha Integration

```typescript
// test/mocha-setup.js
const { TransportMock, TestWorkerMock } = require('@testring/test-utils');

// Setup before each test
beforeEach(function() {
  this.transportMock = new TransportMock();
  this.testWorker = new TestWorkerMock(false, 0);
});

// Cleanup after each test
afterEach(function() {
  this.transportMock.removeAllListeners();
});
```

## Dependencies

- **`@testring/types`** - TypeScript type definitions
- **`events`** - Node.js event system
- **`fs`** - Node.js file system
- **`path`** - Node.js path handling

## Related Modules

- **`@testring/transport`** - Real transport layer implementation
- **`@testring/test-worker`** - Real test worker implementation
- **`@testring/browser-proxy`** - Browser proxy implementation
- **`@testring/test-runner`** - Test runner

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.