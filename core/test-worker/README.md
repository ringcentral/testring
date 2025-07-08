# @testring/test-worker

测试工作进程模块，提供了测试的并行执行和隔离环境支持。

## 功能概述

该模块负责创建和管理测试工作进程，确保测试在独立的环境中执行：
- 创建子进程来运行测试
- 管理测试工作进程的生命周期
- 提供进程间通信机制
- 处理测试执行结果

## 主要组件

### TestWorker
测试工作进程管理器，负责创建和管理工作进程：

```typescript
export class TestWorker {
  spawn(): ITestWorkerInstance  // 创建新的工作进程实例
}
```

### TestWorkerInstance
测试工作进程实例，代表一个运行中的测试工作进程：

```typescript
export interface ITestWorkerInstance {
  getWorkerID(): string        // 获取工作进程ID
  execute(test: IQueuedTest): Promise<void>  // 执行测试
  kill(): Promise<void>        // 终止工作进程
}
```

## 工作原理

### 进程隔离
- 每个测试在独立的 Node.js 子进程中运行
- 避免测试之间的相互影响
- 支持并行执行多个测试

### 通信机制
- 使用 IPC（进程间通信）传递测试数据
- 支持双向通信（父进程 ↔ 子进程）
- 处理测试结果和错误信息

### 生命周期管理
1. **创建阶段** - 启动子进程
2. **初始化阶段** - 设置测试环境
3. **执行阶段** - 运行测试代码
4. **清理阶段** - 清理资源并终止进程

## 使用方法

### 基本使用
```typescript
import { TestWorker } from '@testring/test-worker';

// 创建测试工作进程管理器
const testWorker = new TestWorker(config, transport);

// 生成工作进程实例
const workerInstance = testWorker.spawn();

// 执行测试
await workerInstance.execute(queuedTest);

// 终止工作进程
await workerInstance.kill();
```

### 并行执行
```typescript
import { TestWorker } from '@testring/test-worker';

const testWorker = new TestWorker(config, transport);

// 创建多个工作进程
const workers = Array.from({ length: 4 }, () => testWorker.spawn());

// 并行执行测试
const promises = workers.map(worker => worker.execute(test));
await Promise.all(promises);

// 清理所有工作进程
await Promise.all(workers.map(worker => worker.kill()));
```

## 配置选项

### 工作进程限制
```typescript
interface IConfig {
  workerLimit: number | 'local';  // 工作进程数量限制
  restartWorker: boolean;         // 是否在测试完成后重启工作进程
}
```

### 本地模式
当 `workerLimit` 设置为 `'local'` 时，测试在主进程中运行：
- 不创建子进程
- 适用于调试和开发
- 性能更高但缺少隔离

## 错误处理

### 进程异常处理
- 捕获子进程的异常退出
- 提供详细的错误信息
- 支持自动重启机制

### 通信错误处理
- 处理 IPC 通信失败
- 超时检测和处理
- 优雅的进程终止

## 性能优化

### 进程复用
- 支持工作进程的复用
- 减少进程创建开销
- 可配置的进程重启策略

### 内存管理
- 监控工作进程的内存使用
- 防止内存泄漏
- 自动清理资源

## 调试支持

### 调试模式
```typescript
// 启用调试模式
const config = {
  workerLimit: 'local',  // 在主进程中运行
  debug: true           // 启用调试输出
};
```

### 日志记录
- 详细的进程创建和销毁日志
- 测试执行状态跟踪
- 错误和异常记录

## 安装

```bash
npm install @testring/test-worker
```

## 依赖

- `@testring/child-process` - 子进程管理
- `@testring/transport` - 进程间通信
- `@testring/logger` - 日志记录
- `@testring/types` - 类型定义

## 相关模块

- `@testring/test-run-controller` - 测试运行控制器
- `@testring/child-process` - 子进程管理
- `@testring/transport` - 传输层