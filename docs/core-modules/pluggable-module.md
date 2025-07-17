# @testring/pluggable-module

可插拔模块系统，为 testring 框架提供了强大的插件机制。通过 Hook（钩子）系统，允许外部插件在核心功能的关键节点注入自定义逻辑，实现框架的灵活扩展。

[![npm version](https://badge.fury.io/js/@testring/pluggable-module.svg)](https://www.npmjs.com/package/@testring/pluggable-module)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## 功能概述

该模块是 testring 框架插件系统的核心基础，提供了：
- 基于事件的插件钩子机制
- 灵活的生命周期管理
- 异步插件执行支持
- 完善的错误处理机制
- 数据修改和只读钩子支持

## 主要特性

### 事件驱动架构
- 基于 Hook 的事件系统
- 支持多个插件同时注册
- 按顺序执行插件逻辑
- 异步操作支持

### 灵活的钩子类型
- **Write Hook** - 可修改数据的钩子
- **Read Hook** - 只读监听钩子
- 支持链式数据处理
- 完整的错误传播

### 完善的错误处理
- 插件级别的错误隔离
- 详细的错误信息提供
- 错误堆栈保留
- 优雅的故障处理

## 核心概念

### Hook（钩子）
Hook 是插件系统的核心概念，代表一个可以注册回调函数的事件点：

```typescript
// Write Hook - 可以修改传入的数据
hook.writeHook('myPlugin', (data) => {
  return modifiedData;
});

// Read Hook - 只读访问数据
hook.readHook('myPlugin', (data) => {
  console.log('处理数据:', data);
});
```

### PluggableModule（可插拔模块）
PluggableModule 是可插拔功能的基类，内部维护一组命名的 Hook：

```typescript
class MyModule extends PluggableModule {
  constructor() {
    super(['beforeStart', 'afterStart', 'beforeEnd']);
  }

  async doSomething() {
    // 在关键节点调用钩子
    await this.callHook('beforeStart');
    // 核心逻辑...
    await this.callHook('afterStart');
  }
}
```

## 安装

```bash
npm install @testring/pluggable-module
```

## 基本用法

### 创建可插拔模块

```typescript
import { PluggableModule } from '@testring/pluggable-module';

class FileProcessor extends PluggableModule {
  constructor() {
    // 定义钩子名称
    super([
      'beforeRead',
      'afterRead', 
      'beforeWrite',
      'afterWrite'
    ]);
  }

  async readFile(filePath: string) {
    // 读取前钩子
    const processedPath = await this.callHook('beforeRead', filePath);
    
    // 核心逻辑：读取文件
    const content = await fs.readFile(processedPath, 'utf8');
    
    // 读取后钩子
    const processedContent = await this.callHook('afterRead', content, filePath);
    
    return processedContent;
  }

  async writeFile(filePath: string, content: string) {
    // 写入前钩子
    const { path, data } = await this.callHook('beforeWrite', {
      path: filePath,
      content: content
    });
    
    // 核心逻辑：写入文件
    await fs.writeFile(path, data);
    
    // 写入后钩子
    await this.callHook('afterWrite', path, data);
  }
}
```

### 注册插件

```typescript
const fileProcessor = new FileProcessor();

// 获取钩子并注册插件
const beforeReadHook = fileProcessor.getHook('beforeRead');
const afterReadHook = fileProcessor.getHook('afterRead');

// 路径预处理插件
beforeReadHook?.writeHook('pathNormalizer', (filePath) => {
  return path.resolve(filePath);
});

// 内容缓存插件
afterReadHook?.writeHook('contentCache', (content, filePath) => {
  cache.set(filePath, content);
  return content;
});

// 日志记录插件
afterReadHook?.readHook('logger', (content, filePath) => {
  console.log(`已读取文件: ${filePath}, 大小: ${content.length}`);
});
```

## Hook 类型详解

### Write Hook（写入钩子）
Write Hook 可以修改传递的数据，支持链式处理：

```typescript
import { Hook } from '@testring/pluggable-module';

const hook = new Hook();

// 注册多个 Write Hook
hook.writeHook('plugin1', (data) => {
  return { ...data, processed: true };
});

hook.writeHook('plugin2', (data) => {
  return { ...data, timestamp: Date.now() };
});

hook.writeHook('plugin3', (data) => {
  return { ...data, id: generateId() };
});

// 调用钩子 - 数据会按顺序被每个插件处理
const result = await hook.callHooks({ message: 'hello' });
// 结果: { message: 'hello', processed: true, timestamp: 1234567890, id: 'abc123' }
```

### Read Hook（读取钩子）
Read Hook 只能读取数据，不能修改，适用于监听和日志记录：

```typescript
const hook = new Hook();

// 注册读取钩子
hook.readHook('monitor', (data) => {
  metrics.increment('data.processed');
  console.log('处理数据:', data);
});

hook.readHook('validator', (data) => {
  if (!data.isValid) {
    throw new Error('数据验证失败');
  }
});

hook.readHook('notifier', (data) => {
  if (data.priority === 'high') {
    sendNotification(data);
  }
});

// 调用钩子
await hook.callHooks(inputData);
```

### 混合使用
Write Hook 和 Read Hook 可以同时使用：

```typescript
const hook = new Hook();

// 先执行所有 Write Hook（修改数据）
hook.writeHook('transformer', (data) => transformData(data));
hook.writeHook('validator', (data) => validateAndFix(data));

// 再执行所有 Read Hook（只读访问）
hook.readHook('logger', (data) => logData(data));
hook.readHook('metrics', (data) => recordMetrics(data));

// 执行顺序：writeHook1 -> writeHook2 -> readHook1 -> readHook2
const result = await hook.callHooks(originalData);
```

## 高级用法

### 复杂的数据处理流水线

```typescript
class DataProcessor extends PluggableModule {
  constructor() {
    super([
      'beforeValidation',
      'afterValidation',
      'beforeTransform',
      'afterTransform',
      'beforeSave',
      'afterSave'
    ]);
  }

  async processData(rawData: any) {
    try {
      // 验证阶段
      const validatedData = await this.callHook('beforeValidation', rawData);
      const validationResult = this.validate(validatedData);
      await this.callHook('afterValidation', validationResult);

      // 转换阶段
      const preTransformData = await this.callHook('beforeTransform', validationResult);
      const transformedData = this.transform(preTransformData);
      const postTransformData = await this.callHook('afterTransform', transformedData);

      // 保存阶段
      const preSaveData = await this.callHook('beforeSave', postTransformData);
      const savedData = await this.save(preSaveData);
      await this.callHook('afterSave', savedData);

      return savedData;
    } catch (error) {
      console.error('数据处理失败:', error);
      throw error;
    }
  }

  private validate(data: any) {
    // 验证逻辑
    return data;
  }

  private transform(data: any) {
    // 转换逻辑
    return data;
  }

  private async save(data: any) {
    // 保存逻辑
    return data;
  }
}
```

### 插件管理系统

```typescript
class PluginManager {
  private modules: Map<string, PluggableModule> = new Map();
  private plugins: Map<string, any> = new Map();

  registerModule(name: string, module: PluggableModule) {
    this.modules.set(name, module);
  }

  registerPlugin(name: string, plugin: any) {
    this.plugins.set(name, plugin);
    this.applyPlugin(name, plugin);
  }

  private applyPlugin(name: string, plugin: any) {
    for (const [moduleName, module] of this.modules) {
      if (plugin[moduleName]) {
        const moduleConfig = plugin[moduleName];
        
        Object.keys(moduleConfig).forEach(hookName => {
          const hook = module.getHook(hookName);
          if (hook) {
            const handlers = moduleConfig[hookName];
            
            if (handlers.write) {
              hook.writeHook(name, handlers.write);
            }
            
            if (handlers.read) {
              hook.readHook(name, handlers.read);
            }
          }
        });
      }
    }
  }

  unregisterPlugin(name: string) {
    this.plugins.delete(name);
    // 重新应用所有插件（实际实现中可以更精确地移除）
    this.reapplyAllPlugins();
  }

  private reapplyAllPlugins() {
    // 清除所有钩子
    for (const module of this.modules.values()) {
      // 实际实现需要清除钩子的方法
    }
    
    // 重新应用所有插件
    for (const [name, plugin] of this.plugins) {
      this.applyPlugin(name, plugin);
    }
  }
}
```

## 实际应用场景

### 文件系统扩展

```typescript
class FileSystem extends PluggableModule {
  constructor() {
    super(['beforeRead', 'afterRead', 'beforeWrite', 'afterWrite']);
  }

  async readFile(path: string) {
    const processedPath = await this.callHook('beforeRead', path);
    const content = await fs.readFile(processedPath, 'utf8');
    return await this.callHook('afterRead', content, processedPath);
  }

  async writeFile(path: string, content: string) {
    const { finalPath, finalContent } = await this.callHook('beforeWrite', { path, content });
    await fs.writeFile(finalPath, finalContent);
    await this.callHook('afterWrite', finalPath, finalContent);
  }
}

// 插件：文件压缩
const compressionPlugin = {
  afterRead: {
    write: (content) => decompress(content)
  },
  beforeWrite: {
    write: ({ path, content }) => ({
      path,
      content: compress(content)
    })
  }
};

// 插件：文件加密
const encryptionPlugin = {
  afterRead: {
    write: (content) => decrypt(content)
  },
  beforeWrite: {
    write: ({ path, content }) => ({
      path,
      content: encrypt(content)
    })
  }
};

// 插件：访问日志
const loggingPlugin = {
  afterRead: {
    read: (content, path) => console.log(`读取文件: ${path}`)
  },
  afterWrite: {
    read: (path, content) => console.log(`写入文件: ${path}`)
  }
};
```

### 测试执行扩展

```typescript
class TestRunner extends PluggableModule {
  constructor() {
    super([
      'beforeTest',
      'afterTest',
      'beforeSuite',
      'afterSuite',
      'onTestPass',
      'onTestFail'
    ]);
  }

  async runSuite(testSuite: TestSuite) {
    await this.callHook('beforeSuite', testSuite);
    
    for (const test of testSuite.tests) {
      await this.runTest(test);
    }
    
    await this.callHook('afterSuite', testSuite);
  }

  async runTest(test: Test) {
    const preparedTest = await this.callHook('beforeTest', test);
    
    try {
      const result = await this.executeTest(preparedTest);
      await this.callHook('onTestPass', result);
      await this.callHook('afterTest', result);
      return result;
    } catch (error) {
      await this.callHook('onTestFail', test, error);
      await this.callHook('afterTest', test, error);
      throw error;
    }
  }

  private async executeTest(test: Test) {
    // 测试执行逻辑
    return { test, status: 'passed' };
  }
}

// 截图插件
const screenshotPlugin = {
  onTestFail: {
    read: async (test, error) => {
      const screenshot = await takeScreenshot();
      await saveScreenshot(`${test.name}-failure.png`, screenshot);
    }
  }
};

// 性能监控插件
const performancePlugin = {
  beforeTest: {
    write: (test) => {
      test.startTime = Date.now();
      return test;
    }
  },
  afterTest: {
    read: (result) => {
      const duration = Date.now() - result.test.startTime;
      console.log(`测试 ${result.test.name} 耗时: ${duration}ms`);
    }
  }
};

// 报告生成插件
const reportPlugin = {
  afterSuite: {
    read: (testSuite) => {
      generateHtmlReport(testSuite.results);
      generateJunitReport(testSuite.results);
    }
  }
};
```

## 错误处理

### 插件错误隔离

```typescript
class RobustModule extends PluggableModule {
  constructor() {
    super(['process']);
  }

  async processWithErrorHandling(data: any) {
    try {
      return await this.callHook('process', data);
    } catch (error) {
      console.error('插件执行失败:', error);
      
      // 根据错误类型决定处理策略
      if (error.message.includes('Plugin')) {
        // 插件错误，可以继续执行
        console.warn('插件执行失败，使用默认处理');
        return this.defaultProcess(data);
      } else {
        // 系统错误，需要中断
        throw error;
      }
    }
  }

  private defaultProcess(data: any) {
    // 默认处理逻辑
    return data;
  }
}
```

### 错误恢复机制

```typescript
class ErrorRecoveryModule extends PluggableModule {
  private errorCount = 0;
  private maxErrors = 3;

  constructor() {
    super(['transform']);
  }

  async transformWithRecovery(data: any) {
    try {
      const result = await this.callHook('transform', data);
      this.errorCount = 0; // 重置错误计数
      return result;
    } catch (error) {
      this.errorCount++;
      
      if (this.errorCount >= this.maxErrors) {
        console.error('错误次数超限，停用插件系统');
        return this.fallbackTransform(data);
      }
      
      console.warn(`插件错误 ${this.errorCount}/${this.maxErrors}:`, error);
      return this.fallbackTransform(data);
    }
  }

  private fallbackTransform(data: any) {
    // 备用处理逻辑
    return data;
  }
}
```

## 性能优化

### 异步并行执行

```typescript
class ParallelModule extends PluggableModule {
  constructor() {
    super(['parallelProcess']);
  }

  async processInParallel(items: any[]) {
    // 并行处理多个项目
    const promises = items.map(async (item) => {
      return await this.callHook('parallelProcess', item);
    });
    
    return await Promise.all(promises);
  }
}
```

### 插件缓存

```typescript
class CachedModule extends PluggableModule {
  private cache = new Map();

  constructor() {
    super(['cachedProcess']);
  }

  async processWithCache(data: any) {
    const cacheKey = JSON.stringify(data);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const result = await this.callHook('cachedProcess', data);
    this.cache.set(cacheKey, result);
    
    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

## 调试和监控

### 插件执行监控

```typescript
class MonitoredModule extends PluggableModule {
  constructor() {
    super(['monitored']);
  }

  async processWithMonitoring(data: any) {
    const startTime = Date.now();
    
    try {
      const result = await this.callHook('monitored', data);
      
      const duration = Date.now() - startTime;
      console.log(`插件执行完成，耗时: ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`插件执行失败，耗时: ${duration}ms`, error);
      throw error;
    }
  }
}
```

### 调试模式

```typescript
class DebuggableModule extends PluggableModule {
  private debug: boolean;

  constructor(debug = false) {
    super(['debug']);
    this.debug = debug;
  }

  protected async callHook<T = any>(name: string, ...args: any[]): Promise<T> {
    if (this.debug) {
      console.log(`[DEBUG] 调用钩子: ${name}`, args);
    }
    
    try {
      const result = await super.callHook(name, ...args);
      
      if (this.debug) {
        console.log(`[DEBUG] 钩子 ${name} 执行成功`, result);
      }
      
      return result;
    } catch (error) {
      if (this.debug) {
        console.error(`[DEBUG] 钩子 ${name} 执行失败:`, error);
      }
      throw error;
    }
  }
}
```

## 最佳实践

### 1. 钩子命名规范
- 使用描述性的钩子名称
- 遵循 `before/after` + `动作` 的命名模式
- 保持命名一致性

```typescript
// 好的命名
['beforeRead', 'afterRead', 'beforeWrite', 'afterWrite']

// 避免的命名
['read1', 'read2', 'doSomething', 'hook1']
```

### 2. 错误处理策略
- 总是提供错误恢复机制
- 记录详细的错误信息
- 避免插件错误影响核心功能

### 3. 性能考虑
- 避免在钩子中执行重计算
- 使用缓存减少重复处理
- 考虑异步并行执行

### 4. 插件设计原则
- 单一职责原则
- 最小影响原则
- 可配置性原则

## 与 testring 框架集成

在 testring 框架中，多个核心模块都继承自 PluggableModule：

```typescript
// fs-reader 模块
class FSReader extends PluggableModule {
  constructor() {
    super(['beforeResolve', 'afterResolve']);
  }
}

// logger 模块  
class Logger extends PluggableModule {
  constructor() {
    super(['beforeLog', 'afterLog']);
  }
}

// test-run-controller 模块
class TestRunController extends PluggableModule {
  constructor() {
    super(['beforeRun', 'afterRun', 'onTestComplete']);
  }
}
```

这样的设计使得整个框架具有高度的可扩展性。

## 安装

```bash
npm install @testring/pluggable-module
```

## 依赖

- `@testring/types` - 类型定义

## 相关模块

- `@testring/plugin-api` - 插件 API 接口
- `@testring/fs-reader` - 文件系统读取器
- `@testring/logger` - 日志系统
- `@testring/test-run-controller` - 测试运行控制器

## 许可证

MIT License
