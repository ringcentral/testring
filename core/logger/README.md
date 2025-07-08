# @testring/logger

分布式日志系统模块，提供了多进程环境下的日志记录和管理功能。

## 功能概述

该模块提供了完整的日志记录解决方案，支持：
- 多进程环境下的日志聚合
- 可配置的日志级别过滤
- 插件化的日志处理
- 格式化的日志输出

## 主要组件

### LoggerServer
日志服务器，负责处理和输出日志：

```typescript
export class LoggerServer extends PluggableModule {
  constructor(
    config: IConfigLogger,
    transportInstance: ITransport,
    stdout: NodeJS.WritableStream
  )
}
```

### LoggerClient
日志客户端，提供日志记录接口：

```typescript
export interface ILoggerClient {
  verbose(...args: any[]): void
  debug(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
}
```

## 日志级别

支持以下日志级别（按优先级排序）：

1. **`verbose`** - 最详细的调试信息
2. **`debug`** - 调试信息
3. **`info`** - 一般信息（默认级别）
4. **`warning`** - 警告信息
5. **`error`** - 错误信息
6. **`silent`** - 静默模式，不输出任何日志

## 使用方法

### 基本使用
```typescript
import { loggerClient } from '@testring/logger';

// 记录不同级别的日志
loggerClient.verbose('详细的调试信息');
loggerClient.debug('调试信息');
loggerClient.info('一般信息');
loggerClient.warn('警告信息');
loggerClient.error('错误信息');
```

### 配置日志级别
```typescript
import { LoggerServer } from '@testring/logger';

const config = {
  logLevel: 'debug',  // 只显示 debug 及以上级别的日志
  silent: false       // 是否静默模式
};

const loggerServer = new LoggerServer(config, transport, process.stdout);
```

### 日志格式化
```typescript
// 日志会自动格式化输出
loggerClient.info('测试开始', { testId: 'test-001' });
// 输出: [INFO] 测试开始 { testId: 'test-001' }
```

## 配置选项

### 日志级别配置
```typescript
interface IConfigLogger {
  logLevel: 'verbose' | 'debug' | 'info' | 'warning' | 'error' | 'silent';
  silent: boolean;  // 快速静默模式
}
```

### 命令行配置
```bash
# 设置日志级别
testring run --logLevel debug

# 静默模式
testring run --silent

# 或者
testring run --logLevel silent
```

### 配置文件
```json
{
  "logLevel": "debug",
  "silent": false
}
```

## 插件支持

日志系统支持插件扩展，可以自定义日志处理逻辑：

### 插件钩子
- `beforeLog` - 日志输出前处理
- `onLog` - 日志输出时处理
- `onError` - 错误处理

### 自定义日志插件
```typescript
export default (pluginAPI) => {
  const logger = pluginAPI.getLogger();
  
  logger.beforeLog((logEntity, meta) => {
    // 日志预处理
    return {
      ...logEntity,
      timestamp: new Date().toISOString()
    };
  });
  
  logger.onLog((logEntity, meta) => {
    // 自定义日志处理
    if (logEntity.logLevel === 'error') {
      // 发送错误报告
      sendErrorReport(logEntity.content);
    }
  });
};
```

## 多进程支持

### 进程间日志聚合
日志系统在多进程环境中会自动聚合所有进程的日志：

```typescript
// 子进程中的日志
loggerClient.info('子进程日志');

// 会自动传输到主进程并统一输出
// [INFO] [Worker-1] 子进程日志
```

### 进程标识
每个进程的日志都会带有进程标识，便于调试：
- 主进程：无标识
- 子进程：`[Worker-{ID}]`

## 日志格式

### 标准格式
```
[LEVEL] [ProcessID] Message
```

### 示例输出
```
[INFO] 测试开始
[DEBUG] [Worker-1] 加载测试文件: test.spec.js
[WARN] [Worker-2] 测试重试: 第2次
[ERROR] [Worker-1] 测试失败: 断言错误
```

## 性能优化

### 异步日志处理
- 使用队列系统处理日志
- 避免阻塞主流程
- 支持批量处理

### 内存管理
- 自动清理日志队列
- 防止内存泄漏
- 可配置的缓冲区大小

## 调试功能

### 日志追踪
```typescript
// 启用详细日志追踪
const config = {
  logLevel: 'verbose'
};

// 会输出详细的执行信息
loggerClient.verbose('详细的调试信息', { 
  stack: new Error().stack 
});
```

### 错误上下文
错误日志会包含完整的上下文信息：
- 错误堆栈
- 进程信息
- 时间戳
- 相关参数

## 安装

```bash
npm install @testring/logger
```

## 依赖

- `@testring/pluggable-module` - 插件支持
- `@testring/utils` - 工具函数
- `@testring/transport` - 进程间通信
- `@testring/types` - 类型定义

## 相关模块

- `@testring/cli` - 命令行工具
- `@testring/plugin-api` - 插件接口
- `@testring/transport` - 传输层