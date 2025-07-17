# @testring/child-process

Child process management module that provides cross-platform child process creation and management capabilities, supporting direct execution of JavaScript and TypeScript files.

## Overview

This module provides enhanced child process management features, including:
- Support for direct execution of JavaScript and TypeScript files
- Cross-platform compatibility (Windows, Linux, macOS)
- Debug mode support
- Inter-process communication (IPC)
- Automatic port allocation
- Process state detection

## Main Features

### fork
Enhanced child process creation function supporting multiple file types:

```typescript
export async function fork(
  filePath: string,
  args?: Array<string>,
  options?: Partial<IChildProcessForkOptions>
): Promise<IChildProcessFork>
```

### spawn
Basic child process launch functionality:

```typescript
export function spawn(
  command: string,
  args?: Array<string>
): childProcess.ChildProcess
```

### spawnWithPipes
Child process launch with pipes:

```typescript
export function spawnWithPipes(
  command: string,
  args?: Array<string>
): childProcess.ChildProcess
```

### isChildProcess
Check if the current process is a child process:

```typescript
export function isChildProcess(argv?: string[]): boolean
```

## Usage

### Basic Usage

#### Execute JavaScript Files
```typescript
import { fork } from '@testring/child-process';

// Execute JavaScript file
const childProcess = await fork('./worker.js');

childProcess.on('message', (data) => {
  console.log('Received message:', data);
});

childProcess.send({ type: 'start', data: 'hello' });
```

#### Execute TypeScript Files
```typescript
import { fork } from '@testring/child-process';

// Directly execute TypeScript file (automatically handles ts-node)
const childProcess = await fork('./worker.ts');

childProcess.on('message', (data) => {
  console.log('Received message:', data);
});
```

#### Pass Arguments
```typescript
import { fork } from '@testring/child-process';

// Pass command line arguments
const childProcess = await fork('./worker.js', ['--mode', 'production']);

// Access arguments in child process
// process.argv contains the passed arguments
```

### Debug Mode

#### Enable Debugging
```typescript
import { fork } from '@testring/child-process';

// Enable debug mode
const childProcess = await fork('./worker.js', [], {
  debug: true
});

// Access debug port
console.log('Debug port:', childProcess.debugPort);
// You can use Chrome DevTools or VS Code to connect to this port
```

#### Custom Debug Port Range
```typescript
import { fork } from '@testring/child-process';

const childProcess = await fork('./worker.js', [], {
  debug: true,
  debugPortRange: [9229, 9230, 9231, 9232]
});
```

### Inter-Process Communication

#### Parent Process Code
```typescript
import { fork } from '@testring/child-process';

const childProcess = await fork('./worker.js');

// Send message to child process
childProcess.send({
  type: 'task',
  data: { id: 1, action: 'process' }
});

// Listen for child process messages
childProcess.on('message', (message) => {
  if (message.type === 'result') {
    console.log('Task result:', message.data);
  }
});

// Listen for child process exit
childProcess.on('exit', (code, signal) => {
  console.log(`Child process exited: code=${code}, signal=${signal}`);
});
```

#### Child Process Code (worker.js)
```javascript
// Listen for parent process messages
process.on('message', (message) => {
  if (message.type === 'task') {
    const result = processTask(message.data);
    
    // Send result back to parent process
    process.send({
      type: 'result',
      data: result
    });
  }
});

function processTask(data) {
  // Process task logic
  return { id: data.id, status: 'completed' };
}
```

### 进程状态检测

#### 检查是否为子进程
```typescript
import { isChildProcess } from '@testring/child-process';

if (isChildProcess()) {
  console.log('运行在子进程中');
  // 子进程特定的逻辑
} else {
  console.log('运行在主进程中');
  // 主进程特定的逻辑
}
```

#### 检查特定参数
```typescript
import { isChildProcess } from '@testring/child-process';

// 检查自定义参数
const customArgs = ['--testring-parent-pid=12345'];
if (isChildProcess(customArgs)) {
  console.log('这是 testring 子进程');
}
```

### 使用 spawn 功能

#### 基本 spawn
```typescript
import { spawn } from '@testring/child-process';

// 启动基本子进程
const childProcess = spawn('node', ['--version']);

childProcess.stdout.on('data', (data) => {
  console.log(`输出: ${data}`);
});

childProcess.stderr.on('data', (data) => {
  console.error(`错误: ${data}`);
});
```

#### 带管道的 spawn
```typescript
import { spawnWithPipes } from '@testring/child-process';

// 启动带管道的子进程
const childProcess = spawnWithPipes('node', ['script.js']);

// 向子进程发送数据
childProcess.stdin.write('hello\n');
childProcess.stdin.end();

// 读取输出
childProcess.stdout.on('data', (data) => {
  console.log(`输出: ${data}`);
});
```

## 跨平台支持

### Windows 特殊处理
模块自动处理 Windows 平台的差异：

```typescript
// 在 Windows 上会自动使用 'node' 命令
// 在 Unix 系统上会使用 ts-node 或 node 根据文件类型
const childProcess = await fork('./worker.ts');
```

### TypeScript 支持
自动检测和处理 TypeScript 文件：

```typescript
// .ts 文件会自动使用 ts-node 执行
const tsProcess = await fork('./worker.ts');

// .js 文件使用 node 执行
const jsProcess = await fork('./worker.js');

// 无扩展名文件根据环境自动选择
const process = await fork('./worker');
```

## 配置选项

### IChildProcessForkOptions
```typescript
interface IChildProcessForkOptions {
  debug: boolean;                    // 是否启用调试模式
  debugPortRange: Array<number>;     // 调试端口范围
}
```

### 默认配置
```typescript
const DEFAULT_FORK_OPTIONS = {
  debug: false,
  debugPortRange: [9229, 9222, ...getNumberRange(9230, 9240)]
};
```

## 实际应用场景

### 测试工作进程
```typescript
import { fork } from '@testring/child-process';

// 创建测试工作进程
const createTestWorker = async (testFile: string) => {
  const worker = await fork('./test-runner.js', [testFile]);
  
  return new Promise((resolve, reject) => {
    worker.on('message', (message) => {
      if (message.type === 'test-result') {
        resolve(message.data);
      } else if (message.type === 'test-error') {
        reject(new Error(message.error));
      }
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`工作进程异常退出: ${code}`));
      }
    });
  });
};

// 使用
const result = await createTestWorker('./my-test.spec.js');
```

### 并行任务处理
```typescript
import { fork } from '@testring/child-process';

const processTasks = async (tasks: any[]) => {
  const workers = await Promise.all(
    tasks.map(task => fork('./task-worker.js'))
  );
  
  const results = await Promise.all(
    workers.map((worker, index) => {
      return new Promise((resolve) => {
        worker.on('message', (result) => {
          resolve(result);
        });
        
        worker.send(tasks[index]);
      });
    })
  );
  
  // 清理工作进程
  workers.forEach(worker => worker.kill());
  
  return results;
};
```

### 调试支持
```typescript
import { fork } from '@testring/child-process';

const createDebugWorker = async (script: string) => {
  const worker = await fork(script, [], {
    debug: true,
    debugPortRange: [9229, 9230, 9231]
  });
  
  console.log(`调试端口: ${worker.debugPort}`);
  console.log(`可以使用以下命令连接调试器:`);
  console.log(`chrome://inspect 或 VS Code 连接到 localhost:${worker.debugPort}`);
  
  return worker;
};
```

## 错误处理

### 进程异常处理
```typescript
import { fork } from '@testring/child-process';

const createRobustWorker = async (script: string) => {
  try {
    const worker = await fork(script);
    
    worker.on('error', (error) => {
      console.error('进程错误:', error);
    });
    
    worker.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`进程异常退出: code=${code}, signal=${signal}`);
      }
    });
    
    return worker;
  } catch (error) {
    console.error('创建进程失败:', error);
    throw error;
  }
};
```

### 超时处理
```typescript
import { fork } from '@testring/child-process';

const createWorkerWithTimeout = async (script: string, timeout: number) => {
  const worker = await fork(script);
  
  const timeoutId = setTimeout(() => {
    console.log('进程超时，强制终止');
    worker.kill('SIGTERM');
  }, timeout);
  
  worker.on('exit', () => {
    clearTimeout(timeoutId);
  });
  
  return worker;
};
```

## 性能优化

### 进程池管理
```typescript
import { fork } from '@testring/child-process';

class WorkerPool {
  private workers: any[] = [];
  private maxWorkers: number;
  
  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
  }
  
  async getWorker(script: string) {
    if (this.workers.length < this.maxWorkers) {
      const worker = await fork(script);
      this.workers.push(worker);
      return worker;
    }
    
    // 重用现有工作进程
    return this.workers[this.workers.length - 1];
  }
  
  async cleanup() {
    await Promise.all(
      this.workers.map(worker => 
        new Promise(resolve => {
          worker.on('exit', resolve);
          worker.kill();
        })
      )
    );
    this.workers = [];
  }
}
```

### 内存管理
```typescript
import { fork } from '@testring/child-process';

const createManagedWorker = async (script: string) => {
  const worker = await fork(script);
  
  // 监控内存使用
  const memoryCheck = setInterval(() => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
      console.warn('内存使用过高，考虑重启进程');
    }
  }, 5000);
  
  worker.on('exit', () => {
    clearInterval(memoryCheck);
  });
  
  return worker;
};
```

## 最佳实践

### 1. 进程生命周期管理
```typescript
// 确保进程正确清理
process.on('exit', () => {
  // 清理所有子进程
  workers.forEach(worker => worker.kill());
});

process.on('SIGTERM', () => {
  // 优雅关闭
  workers.forEach(worker => worker.kill('SIGTERM'));
});
```

### 2. 错误边界
```typescript
// 使用错误边界保护主进程
const safeExecute = async (script: string, data: any) => {
  try {
    const worker = await fork(script);
    
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        worker.kill();
        reject(new Error('执行超时'));
      }, 30000);
      
      worker.on('message', (result) => {
        clearTimeout(timeout);
        resolve(result);
      });
      
      worker.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      
      worker.send(data);
    });
  } catch (error) {
    console.error('执行失败:', error);
    throw error;
  }
};
```

### 3. 调试友好
```typescript
// 开发模式下启用调试
const isDevelopment = process.env.NODE_ENV === 'development';

const worker = await fork('./worker.js', [], {
  debug: isDevelopment
});

if (isDevelopment && worker.debugPort) {
  console.log(`🐛 调试端口: ${worker.debugPort}`);
}
```

## 安装

```bash
npm install @testring/child-process
```

## 依赖

- `@testring/utils` - 工具函数（端口检测等）
- `@testring/types` - 类型定义

## 相关模块

- `@testring/test-worker` - 测试工作进程管理
- `@testring/transport` - 进程间通信
- `@testring/utils` - 实用工具函数