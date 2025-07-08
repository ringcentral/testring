# @testring/async-breakpoints

异步断点系统模块，提供了测试执行过程中的暂停点控制和调试功能。

## 功能概述

该模块提供了一个基于事件的异步断点系统，用于：
- 在测试执行过程中设置暂停点
- 控制测试流程的执行时序
- 支持调试和测试协调
- 提供指令前后的断点控制

## 主要组件

### AsyncBreakpoints
主要的断点管理类，继承自 EventEmitter：

```typescript
export class AsyncBreakpoints extends EventEmitter {
  // 指令前断点
  addBeforeInstructionBreakpoint(): void
  waitBeforeInstructionBreakpoint(callback?: HasBreakpointCallback): Promise<void>
  resolveBeforeInstructionBreakpoint(): void
  isBeforeInstructionBreakpointActive(): boolean
  
  // 指令后断点
  addAfterInstructionBreakpoint(): void
  waitAfterInstructionBreakpoint(callback?: HasBreakpointCallback): Promise<void>
  resolveAfterInstructionBreakpoint(): void
  isAfterInstructionBreakpointActive(): boolean
  
  // 断点控制
  breakStack(): void  // 中断所有断点
}
```

### BreakStackError
断点中断错误类，用于处理断点被强制中断的情况：

```typescript
export class BreakStackError extends Error {
  constructor(message: string)
}
```

## 断点类型

### BreakpointsTypes
```typescript
export enum BreakpointsTypes {
  beforeInstruction = 'beforeInstruction',  // 指令前断点
  afterInstruction = 'afterInstruction'     // 指令后断点
}
```

### BreakpointEvents
```typescript
export enum BreakpointEvents {
  resolverEvent = 'resolveEvent',    // 断点解析事件
  breakStackEvent = 'breakStack'     // 断点中断事件
}
```

## 使用方法

### 基本使用
```typescript
import { AsyncBreakpoints } from '@testring/async-breakpoints';

const breakpoints = new AsyncBreakpoints();

// 设置指令前断点
breakpoints.addBeforeInstructionBreakpoint();

// 等待断点
await breakpoints.waitBeforeInstructionBreakpoint();

// 在另一个地方解析断点
breakpoints.resolveBeforeInstructionBreakpoint();
```

### 使用默认实例
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

// 使用全局默认实例
asyncBreakpoints.addBeforeInstructionBreakpoint();
await asyncBreakpoints.waitBeforeInstructionBreakpoint();
asyncBreakpoints.resolveBeforeInstructionBreakpoint();
```

### 指令前断点
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

// 设置指令前断点
asyncBreakpoints.addBeforeInstructionBreakpoint();

// 检查断点状态
if (asyncBreakpoints.isBeforeInstructionBreakpointActive()) {
  console.log('指令前断点已激活');
}

// 等待断点（会阻塞直到断点被解析）
await asyncBreakpoints.waitBeforeInstructionBreakpoint();

// 解析断点（通常在另一个执行流中）
asyncBreakpoints.resolveBeforeInstructionBreakpoint();
```

### 指令后断点
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

// 设置指令后断点
asyncBreakpoints.addAfterInstructionBreakpoint();

// 等待断点
await asyncBreakpoints.waitAfterInstructionBreakpoint();

// 解析断点
asyncBreakpoints.resolveAfterInstructionBreakpoint();
```

### 断点回调
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

asyncBreakpoints.addBeforeInstructionBreakpoint();

// 带回调的断点等待
await asyncBreakpoints.waitBeforeInstructionBreakpoint(async (hasBreakpoint) => {
  if (hasBreakpoint) {
    console.log('断点已设置，等待解析...');
  } else {
    console.log('没有断点，继续执行');
  }
});
```

## 断点控制

### 中断断点
```typescript
import { asyncBreakpoints, BreakStackError } from '@testring/async-breakpoints';

asyncBreakpoints.addBeforeInstructionBreakpoint();

// 等待断点
asyncBreakpoints.waitBeforeInstructionBreakpoint()
  .catch((error) => {
    if (error instanceof BreakStackError) {
      console.log('断点被中断');
    }
  });

// 中断所有断点
asyncBreakpoints.breakStack();
```

### 并发断点处理
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

// 同时设置多个断点
asyncBreakpoints.addBeforeInstructionBreakpoint();
asyncBreakpoints.addAfterInstructionBreakpoint();

// 并发等待
const promises = Promise.all([
  asyncBreakpoints.waitBeforeInstructionBreakpoint(),
  asyncBreakpoints.waitAfterInstructionBreakpoint()
]);

// 按顺序解析断点
setTimeout(() => {
  asyncBreakpoints.resolveBeforeInstructionBreakpoint();
  asyncBreakpoints.resolveAfterInstructionBreakpoint();
}, 1000);

await promises;
```

## 实际应用场景

### 测试协调
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

// 在测试执行前设置断点
asyncBreakpoints.addBeforeInstructionBreakpoint();

// 测试执行流程
async function runTest() {
  console.log('准备执行测试');
  
  // 等待断点解析
  await asyncBreakpoints.waitBeforeInstructionBreakpoint();
  
  console.log('开始执行测试');
  // 实际测试逻辑
}

// 控制流程
async function controlFlow() {
  setTimeout(() => {
    console.log('解析断点，允许测试继续');
    asyncBreakpoints.resolveBeforeInstructionBreakpoint();
  }, 2000);
}

// 并发执行
Promise.all([runTest(), controlFlow()]);
```

### 调试支持
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

// 调试模式下的断点
if (process.env.DEBUG_MODE) {
  asyncBreakpoints.addBeforeInstructionBreakpoint();
  
  // 等待用户输入或调试器连接
  await asyncBreakpoints.waitBeforeInstructionBreakpoint(async (hasBreakpoint) => {
    if (hasBreakpoint) {
      console.log('调试断点激活，等待调试器...');
    }
  });
}
```

### 多进程同步
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

// 子进程中设置断点
asyncBreakpoints.addAfterInstructionBreakpoint();

// 执行某些操作
performSomeOperation();

// 等待主进程信号
await asyncBreakpoints.waitAfterInstructionBreakpoint();

// 继续执行
continueExecution();
```

## 错误处理

### BreakStackError 处理
```typescript
import { asyncBreakpoints, BreakStackError } from '@testring/async-breakpoints';

try {
  asyncBreakpoints.addBeforeInstructionBreakpoint();
  await asyncBreakpoints.waitBeforeInstructionBreakpoint();
} catch (error) {
  if (error instanceof BreakStackError) {
    console.log('断点被强制中断:', error.message);
    // 处理中断逻辑
  } else {
    console.error('其他错误:', error);
  }
}
```

### 超时处理
```typescript
import { asyncBreakpoints } from '@testring/async-breakpoints';

asyncBreakpoints.addBeforeInstructionBreakpoint();

// 设置超时
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('断点超时')), 5000);
});

try {
  await Promise.race([
    asyncBreakpoints.waitBeforeInstructionBreakpoint(),
    timeoutPromise
  ]);
} catch (error) {
  console.log('断点处理失败:', error.message);
  // 强制中断断点
  asyncBreakpoints.breakStack();
}
```

## 事件监听

### 自定义事件处理
```typescript
import { asyncBreakpoints, BreakpointEvents } from '@testring/async-breakpoints';

// 监听断点解析事件
asyncBreakpoints.on(BreakpointEvents.resolverEvent, (type) => {
  console.log(`断点类型 ${type} 已解析`);
});

// 监听断点中断事件
asyncBreakpoints.on(BreakpointEvents.breakStackEvent, () => {
  console.log('断点栈被中断');
});
```

## 最佳实践

### 1. 断点生命周期管理
```typescript
// 确保断点被正确清理
try {
  asyncBreakpoints.addBeforeInstructionBreakpoint();
  await asyncBreakpoints.waitBeforeInstructionBreakpoint();
} finally {
  // 确保断点被清理
  if (asyncBreakpoints.isBeforeInstructionBreakpointActive()) {
    asyncBreakpoints.resolveBeforeInstructionBreakpoint();
  }
}
```

### 2. 避免死锁
```typescript
// 使用超时避免无限等待
const waitWithTimeout = (breakpointPromise, timeout = 5000) => {
  return Promise.race([
    breakpointPromise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('断点超时')), timeout)
    )
  ]);
};
```

### 3. 调试信息
```typescript
// 添加调试信息
const debugBreakpoint = async (name: string) => {
  console.log(`[DEBUG] 设置断点: ${name}`);
  asyncBreakpoints.addBeforeInstructionBreakpoint();
  
  await asyncBreakpoints.waitBeforeInstructionBreakpoint(async (hasBreakpoint) => {
    console.log(`[DEBUG] 断点 ${name} 状态: ${hasBreakpoint ? '激活' : '未激活'}`);
  });
  
  console.log(`[DEBUG] 断点 ${name} 已解析`);
};
```

## 安装

```bash
npm install @testring/async-breakpoints
```

## 类型定义

```typescript
type HasBreakpointCallback = (state: boolean) => Promise<void> | void;

interface AsyncBreakpoints extends EventEmitter {
  addBeforeInstructionBreakpoint(): void;
  waitBeforeInstructionBreakpoint(callback?: HasBreakpointCallback): Promise<void>;
  resolveBeforeInstructionBreakpoint(): void;
  isBeforeInstructionBreakpointActive(): boolean;
  
  addAfterInstructionBreakpoint(): void;
  waitAfterInstructionBreakpoint(callback?: HasBreakpointCallback): Promise<void>;
  resolveAfterInstructionBreakpoint(): void;
  isAfterInstructionBreakpointActive(): boolean;
  
  breakStack(): void;
}
```

## 相关模块

- `@testring/api` - 测试 API，使用断点进行流程控制
- `@testring/test-worker` - 测试工作进程，使用断点进行进程同步
- `@testring/devtool-backend` - 开发工具后端，使用断点进行调试
