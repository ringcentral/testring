# @testring/transport

传输层模块，提供了多进程环境下的通信机制和消息传递功能。

## 功能概述

该模块是 testring 框架的核心通信层，负责：
- 进程间通信（IPC）管理
- 消息路由和传递
- 广播和点对点通信
- 子进程注册和管理

## 主要组件

### Transport
主要的传输层类，提供完整的通信功能：

```typescript
export class Transport implements ITransport {
  // 点对点通信
  send<T>(processID: string, messageType: string, payload: T): Promise<void>
  
  // 广播通信
  broadcast<T>(messageType: string, payload: T): void
  broadcastLocal<T>(messageType: string, payload: T): void
  broadcastUniversally<T>(messageType: string, payload: T): void
  
  // 事件监听
  on<T>(messageType: string, callback: TransportMessageHandler<T>): void
  once<T>(messageType: string, callback: TransportMessageHandler<T>): void
  onceFrom<T>(processID: string, messageType: string, callback: TransportMessageHandler<T>): void
  
  // 进程管理
  registerChild(processID: string, child: IWorkerEmitter): void
  getProcessesList(): Array<string>
}
```

### DirectTransport
直接传输，用于点对点通信：

```typescript
export class DirectTransport {
  send<T>(processID: string, messageType: string, payload: T): Promise<void>
  registerChild(processID: string, child: IWorkerEmitter): void
  getProcessesList(): Array<string>
}
```

### BroadcastTransport
广播传输，用于广播通信：

```typescript
export class BroadcastTransport {
  broadcast<T>(messageType: string, payload: T): void
  broadcastLocal<T>(messageType: string, payload: T): void
}
```

## 通信模式

### 点对点通信
用于向特定进程发送消息：

```typescript
import { transport } from '@testring/transport';

// 向指定进程发送消息
await transport.send('worker-1', 'execute-test', {
  testFile: 'test.spec.js',
  config: {...}
});
```

### 广播通信
用于向所有进程发送消息：

```typescript
import { transport } from '@testring/transport';

// 向所有子进程广播
transport.broadcast('config-updated', newConfig);

// 向本地进程广播
transport.broadcastLocal('shutdown', null);

// 通用广播（根据环境自动选择）
transport.broadcastUniversally('status-update', status);
```

### 事件监听
监听来自其他进程的消息：

```typescript
import { transport } from '@testring/transport';

// 监听特定类型的消息
transport.on('test-result', (result, processID) => {
  console.log(`收到来自 ${processID} 的测试结果:`, result);
});

// 一次性监听
transport.once('init-complete', (data) => {
  console.log('初始化完成');
});

// 监听来自特定进程的消息
transport.onceFrom('worker-1', 'ready', () => {
  console.log('Worker-1 已就绪');
});
```

## 进程管理

### 子进程注册
```typescript
import { transport } from '@testring/transport';

// 注册子进程
const childProcess = fork('./worker.js');
transport.registerChild('worker-1', childProcess);

// 获取所有已注册的进程
const processes = transport.getProcessesList();
console.log('已注册进程:', processes);
```

### 进程检测
```typescript
import { transport } from '@testring/transport';

// 检查是否为子进程
if (transport.isChildProcess()) {
  console.log('运行在子进程中');
} else {
  console.log('运行在主进程中');
}
```

## 消息格式

### 标准消息格式
```typescript
interface ITransportDirectMessage {
  type: string;    // 消息类型
  payload: any;    // 消息内容
}
```

### 消息处理器
```typescript
type TransportMessageHandler<T> = (message: T, processID?: string) => void;
```

## 使用场景

### 测试执行协调
```typescript
// 主进程：分发测试任务
transport.send('worker-1', 'execute-test', {
  testFile: 'login.spec.js',
  config: testConfig
});

// 子进程：监听测试任务
transport.on('execute-test', async (task) => {
  const result = await executeTest(task.testFile, task.config);
  transport.send('main', 'test-result', result);
});
```

### 日志收集
```typescript
// 子进程：发送日志
transport.send('main', 'log', {
  level: 'info',
  message: '测试开始执行'
});

// 主进程：收集日志
transport.on('log', (logEntry, processID) => {
  console.log(`[${processID}] ${logEntry.level}: ${logEntry.message}`);
});
```

### 配置同步
```typescript
// 主进程：广播配置更新
transport.broadcast('config-update', newConfig);

// 所有子进程：接收配置更新
transport.on('config-update', (config) => {
  updateLocalConfig(config);
});
```

## 错误处理

### 通信错误
```typescript
try {
  await transport.send('worker-1', 'test-command', data);
} catch (error) {
  console.error('发送消息失败:', error);
  // 处理通信错误
}
```

### 超时处理
```typescript
// 设置超时监听
const timeout = setTimeout(() => {
  console.error('消息响应超时');
}, 5000);

transport.onceFrom('worker-1', 'response', (data) => {
  clearTimeout(timeout);
  console.log('收到响应:', data);
});
```

## 性能优化

### 消息缓存
- 自动缓存未送达的消息
- 进程就绪后自动发送缓存消息
- 避免消息丢失

### 连接池管理
- 复用进程连接
- 自动清理断开的连接
- 优化内存使用

## 调试功能

### 消息追踪
```typescript
// 启用调试模式
process.env.DEBUG = 'testring:transport';

// 会输出详细的消息传递日志
transport.send('worker-1', 'test-message', data);
// 输出: [DEBUG] 发送消息 test-message 到 worker-1
```

### 连接状态监控
```typescript
// 监控进程连接状态
transport.on('process-connected', (processID) => {
  console.log(`进程 ${processID} 已连接`);
});

transport.on('process-disconnected', (processID) => {
  console.log(`进程 ${processID} 已断开`);
});
```

## 安装

```bash
npm install @testring/transport
```

## 依赖

- `@testring/child-process` - 子进程管理
- `@testring/types` - 类型定义
- `events` - Node.js 事件模块

## 相关模块

- `@testring/test-worker` - 测试工作进程
- `@testring/logger` - 日志系统
- `@testring/child-process` - 子进程管理