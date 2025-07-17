# @testring/utils

通用工具函数模块，为 testring 框架提供各种实用的工具函数和数据结构。

## 功能概述

该模块提供了 testring 框架所需的各种通用工具函数，包括：
- 端口管理和网络工具
- 队列和栈数据结构
- 包管理和模块加载
- 内存监控和性能分析
- 错误处理和格式化
- 文件系统操作
- 并发控制工具

## 主要特性

### 网络和端口管理
- 端口可用性检测
- 自动获取可用端口
- 随机端口分配
- 端口范围扫描

### 数据结构
- 类型安全的队列实现
- 栈数据结构
- 多锁机制
- 节流控制

### 包和模块管理
- 安全的包加载
- 模块路径解析
- 插件加载机制
- 依赖管理

### 性能监控
- 内存使用报告
- 堆内存分析
- 性能指标收集
- 资源使用统计

## 安装

```bash
npm install --save-dev @testring/utils
```

或使用 yarn:

```bash
yarn add @testring/utils --dev
```

## 主要工具函数

### 端口管理

#### isAvailablePort
检查指定端口是否可用：

```typescript
import { isAvailablePort } from '@testring/utils';

// 检查端口是否可用
const isPortFree = await isAvailablePort(3000, 'localhost');
console.log('端口 3000 是否可用:', isPortFree);
```

#### getAvailablePort
从指定列表中获取可用端口：

```typescript
import { getAvailablePort } from '@testring/utils';

// 从端口列表中获取第一个可用的
const port = await getAvailablePort([3000, 3001, 3002], 'localhost');
console.log('可用端口:', port);

// 如果都不可用，返回随机端口
const randomPort = await getAvailablePort([], 'localhost');
console.log('随机端口:', randomPort);
```

#### getRandomPort
获取系统分配的随机可用端口：

```typescript
import { getRandomPort } from '@testring/utils';

const port = await getRandomPort('localhost');
console.log('随机可用端口:', port);
```

#### getAvailableFollowingPort
从指定端口开始递增查找可用端口：

```typescript
import { getAvailableFollowingPort } from '@testring/utils';

// 从 8000 开始查找可用端口，跳过 8001 和 8003
const port = await getAvailableFollowingPort(8000, 'localhost', [8001, 8003]);
console.log('找到的端口:', port); // 可能是 8000, 8002, 8004 等
```

### 数据结构

#### Queue 队列
类型安全的队列实现：

```typescript
import { Queue } from '@testring/utils';

// 创建字符串队列
const queue = new Queue<string>();

// 添加元素
queue.push('first', 'second', 'third');

// 获取队列长度
console.log('队列长度:', queue.length); // 3

// 取出元素（FIFO）
const first = queue.shift(); // 'first'
const second = queue.shift(); // 'second'

// 查看第一个元素但不移除
const peek = queue.getFirstElement(); // 'third'

// 移除符合条件的元素
const removedCount = queue.remove((item, index) => item.includes('test'));

// 提取符合条件的元素
const extracted = queue.extract((item, index) => item.startsWith('prefix'));

// 清空队列
queue.clean();
```

#### Stack 栈
类型安全的栈实现：

```typescript
import { Stack } from '@testring/utils';

const stack = new Stack<number>();

// 添加元素
stack.push(1, 2, 3);

// 取出元素（LIFO）
const last = stack.pop(); // 3
const second = stack.pop(); // 2

// 清空栈
stack.clean();
```

#### MultiLock 多锁机制
用于并发控制的多锁实现：

```typescript
import { MultiLock } from '@testring/utils';

const multiLock = new MultiLock();

// 获取锁
const lock1 = await multiLock.acquire('resource1');
const lock2 = await multiLock.acquire('resource2');

try {
  // 使用受保护的资源
  console.log('访问 resource1 和 resource2');
} finally {
  // 释放锁
  lock1.release();
  lock2.release();
}

// 支持异步操作
await multiLock.use('resource3', async () => {
  // 在这里安全地使用 resource3
  console.log('独占访问 resource3');
});
```

### 包和模块管理

#### requirePackage
安全地加载 npm 包：

```typescript
import { requirePackage } from '@testring/utils';

try {
  // 安全加载包，支持相对路径解析
  const lodash = requirePackage('lodash', __filename);
  console.log('Lodash 版本:', lodash.VERSION);
} catch (error) {
  console.error('包加载失败:', error.message);
}
```

#### resolvePackage
解析包的路径：

```typescript
import { resolvePackage } from '@testring/utils';

try {
  const packagePath = resolvePackage('express', __filename);
  console.log('Express 包路径:', packagePath);
} catch (error) {
  console.error('包路径解析失败:', error.message);
}
```

#### requirePlugin
专门用于加载 testring 插件：

```typescript
import { requirePlugin } from '@testring/utils';

try {
  const plugin = requirePlugin('@testring/plugin-selenium-driver');
  console.log('插件加载成功');
} catch (error) {
  console.error('插件加载失败:', error.message);
}
```

### 性能监控

#### getMemoryReport
获取详细的内存使用报告：

```typescript
import { getMemoryReport } from '@testring/utils';

const memoryReport = getMemoryReport();
console.log('内存报告:', {
  used: `${(memoryReport.used / 1024 / 1024).toFixed(2)} MB`,
  total: `${(memoryReport.total / 1024 / 1024).toFixed(2)} MB`,
  free: `${(memoryReport.free / 1024 / 1024).toFixed(2)} MB`,
  usage: `${(memoryReport.usage * 100).toFixed(2)}%`
});
```

#### getHeapReport
获取 V8 堆内存详细信息：

```typescript
import { getHeapReport } from '@testring/utils';

const heapReport = getHeapReport();
console.log('堆内存报告:', {
  used: `${(heapReport.used / 1024 / 1024).toFixed(2)} MB`,
  total: `${(heapReport.total / 1024 / 1024).toFixed(2)} MB`,
  heapUsed: `${(heapReport.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  heapTotal: `${(heapReport.heapTotal / 1024 / 1024).toFixed(2)} MB`,
  external: `${(heapReport.external / 1024 / 1024).toFixed(2)} MB`
});
```

### 工具函数

#### generateUniqId
生成唯一标识符：

```typescript
import { generateUniqId } from '@testring/utils';

const id1 = generateUniqId();
const id2 = generateUniqId();

console.log('唯一ID 1:', id1); // 例如: "1234567890123"
console.log('唯一ID 2:', id2); // 例如: "1234567890124"
console.log('是否不同:', id1 !== id2); // true
```

#### throttle
函数节流控制：

```typescript
import { throttle } from '@testring/utils';

// 创建节流函数，最多每 1000ms 执行一次
const throttledFunction = throttle((message: string) => {
  console.log('节流执行:', message);
}, 1000);

// 快速连续调用
throttledFunction('第一次');
throttledFunction('第二次'); // 被忽略
throttledFunction('第三次'); // 被忽略

// 1 秒后
setTimeout(() => {
  throttledFunction('一秒后'); // 会执行
}, 1100);
```

#### restructureError
重构和格式化错误对象：

```typescript
import { restructureError } from '@testring/utils';

try {
  throw new Error('原始错误信息');
} catch (originalError) {
  const restructuredError = restructureError(originalError);
  
  console.log('重构后的错误:', {
    message: restructuredError.message,
    stack: restructuredError.stack,
    name: restructuredError.name
  });
}

// 处理复杂的错误对象
const complexError = {
  code: 'ERR_NETWORK',
  details: '网络连接失败',
  statusCode: 500
};

const formatted = restructureError(complexError);
console.log('格式化后:', formatted);
```

### 文件系统工具

#### fs 模块
扩展的文件系统操作：

```typescript
import { fs } from '@testring/utils';

// 异步读取文件
const content = await fs.readFile('./config.json', 'utf8');

// 异步写入文件
await fs.writeFile('./output.txt', 'Hello World');

// 检查文件是否存在
const exists = await fs.exists('./some-file.txt');

// 创建目录
await fs.mkdir('./new-directory', { recursive: true });

// 读取目录内容
const files = await fs.readdir('./some-directory');
```

## 使用示例

### 端口管理示例
```typescript
import { getAvailablePort, isAvailablePort } from '@testring/utils';

async function startServer() {
  // 优先使用指定端口，否则使用随机端口
  const preferredPorts = [3000, 8000, 8080];
  const port = await getAvailablePort(preferredPorts);
  
  console.log(`服务器将在端口 ${port} 启动`);
  
  // 验证端口确实可用
  if (await isAvailablePort(port, 'localhost')) {
    console.log('端口验证通过');
    // 启动服务器...
  }
}
```

### 队列处理示例
```typescript
import { Queue } from '@testring/utils';

interface Task {
  id: string;
  priority: number;
  action: () => Promise<void>;
}

class TaskProcessor {
  private queue = new Queue<Task>();
  private processing = false;
  
  addTask(task: Task) {
    this.queue.push(task);
    this.processQueue();
  }
  
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;
    
    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift();
        if (task) {
          console.log(`处理任务: ${task.id}`);
          await task.action();
        }
      }
    } finally {
      this.processing = false;
    }
  }
  
  // 获取高优先级任务
  getHighPriorityTasks() {
    return this.queue.extract((task) => task.priority > 5);
  }
}
```

### 内存监控示例
```typescript
import { getMemoryReport, getHeapReport } from '@testring/utils';

class MemoryMonitor {
  private interval: NodeJS.Timeout;
  
  start() {
    this.interval = setInterval(() => {
      const memory = getMemoryReport();
      const heap = getHeapReport();
      
      console.log('内存监控:', {
        系统内存使用率: `${(memory.usage * 100).toFixed(2)}%`,
        堆内存使用: `${(heap.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        外部内存: `${(heap.external / 1024 / 1024).toFixed(2)} MB`
      });
      
      // 内存使用过高时告警
      if (memory.usage > 0.8) {
        console.warn('⚠️ 内存使用率过高!');
      }
    }, 10000); // 每 10 秒检查一次
  }
  
  stop() {
    clearInterval(this.interval);
  }
}
```

### 并发控制示例
```typescript
import { MultiLock, throttle } from '@testring/utils';

class ResourceManager {
  private locks = new MultiLock();
  
  // 使用节流控制的日志记录
  private logThrottled = throttle((message: string) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }, 1000);
  
  async accessDatabase(query: string) {
    return await this.locks.use('database', async () => {
      this.logThrottled('访问数据库');
      // 数据库操作...
      return 'query result';
    });
  }
  
  async writeFile(filename: string, content: string) {
    return await this.locks.use(`file:${filename}`, async () => {
      this.logThrottled(`写入文件: ${filename}`);
      // 文件写入操作...
    });
  }
}
```

## 最佳实践

### 错误处理
```typescript
import { restructureError } from '@testring/utils';

async function safeOperation() {
  try {
    // 可能出错的操作
    await riskyOperation();
  } catch (error) {
    // 统一错误格式化
    const formattedError = restructureError(error);
    console.error('操作失败:', formattedError);
    throw formattedError;
  }
}
```

### 性能监控
```typescript
import { getMemoryReport } from '@testring/utils';

function performanceWrapper<T>(fn: () => T, name: string): T {
  const startTime = Date.now();
  const startMemory = getMemoryReport();
  
  try {
    const result = fn();
    return result;
  } finally {
    const endTime = Date.now();
    const endMemory = getMemoryReport();
    
    console.log(`性能统计 [${name}]:`, {
      执行时间: `${endTime - startTime}ms`,
      内存变化: `${((endMemory.used - startMemory.used) / 1024 / 1024).toFixed(2)} MB`
    });
  }
}
```

### 模块加载
```typescript
import { requirePackage, requirePlugin } from '@testring/utils';

function loadModuleSafely(moduleName: string, context: string) {
  try {
    // 尝试作为普通包加载
    return requirePackage(moduleName, context);
  } catch (error) {
    try {
      // 尝试作为插件加载
      return requirePlugin(moduleName);
    } catch (pluginError) {
      console.error(`无法加载模块 ${moduleName}:`, pluginError.message);
      return null;
    }
  }
}
```

## 类型定义

工具模块的主要类型定义：

```typescript
// 队列接口
interface IQueue<T> {
  push(...elements: T[]): void;
  shift(): T | void;
  clean(): void;
  remove(fn: (item: T, index: number) => boolean): number;
  extract(fn: (item: T, index: number) => boolean): T[];
  getFirstElement(offset?: number): T | null;
  length: number;
}

// 栈接口
interface IStack<T> {
  push(...elements: T[]): void;
  pop(): T | void;
  clean(): void;
  length: number;
}

// 内存报告
interface MemoryReport {
  used: number;
  total: number;
  free: number;
  usage: number;
}

// 堆内存报告
interface HeapReport {
  used: number;
  total: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

// 锁接口
interface Lock {
  release(): void;
}
```

## 依赖关系

该模块尽量减少外部依赖，主要依赖：
- Node.js 内置模块（`fs`, `path`, `net` 等）
- `@testring/types` - 类型定义

## 跨平台支持

所有工具函数都经过跨平台测试，支持：
- Windows
- macOS
- Linux

特别是文件系统和网络相关的功能，都进行了平台兼容性处理。