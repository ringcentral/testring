# @testring/api

测试 API 控制器模块，提供了 testring 框架的主要 API 接口和测试执行控制功能。

## 功能概述

该模块是 testring 框架的核心 API 层，负责：
- 提供测试运行的主要入口点
- 管理测试 API 控制器
- 处理测试生命周期事件
- 集成 Web 应用测试功能

## 主要组件

### TestAPIController
测试 API 控制器类，管理测试的执行状态和参数：

```typescript
export class TestAPIController {
  // 设置和获取测试 ID
  setTestID(testID: string): void
  getTestID(): string
  
  // 管理测试参数
  setTestParameters(parameters: object): void
  getTestParameters(): object
  
  // 管理环境参数
  setEnvironmentParameters(parameters: object): void
  getEnvironmentParameters(): object
  
  // 生命周期回调管理
  registerBeforeRunCallback(callback: BeforeRunCallback): void
  registerAfterRunCallback(callback: AfterRunCallback): void
}
```

### BusEmitter
事件总线，处理测试事件的发布和订阅：

```typescript
export class BusEmitter extends EventEmitter {
  startedTest(): Promise<void>
  finishedTest(): Promise<void>
  failedTest(error: Error): Promise<void>
}
```

### run 函数
测试运行的主要入口点，接受配置参数并执行测试。

## 使用方法

### 基本使用
```typescript
import { run, testAPIController } from '@testring/api';

// 运行测试
await run(config);

// 获取测试控制器
const controller = testAPIController;
controller.setTestID('test-001');
```

### 注册生命周期回调
```typescript
import { testAPIController } from '@testring/api';

// 注册测试开始前的回调
testAPIController.registerBeforeRunCallback(() => {
  console.log('测试即将开始');
});

// 注册测试结束后的回调
testAPIController.registerAfterRunCallback(() => {
  console.log('测试已完成');
});
```

### 事件监听
```typescript
import { testAPIController } from '@testring/api';

const bus = testAPIController.getBus();

bus.on('started', () => {
  console.log('测试开始');
});

bus.on('finished', () => {
  console.log('测试完成');
});

bus.on('failed', (error) => {
  console.error('测试失败:', error);
});
```

## 安装

```bash
npm install @testring/api
```

## 依赖

- `@testring/web-application` - Web 应用测试功能
- `@testring/async-breakpoints` - 异步断点支持
- `@testring/types` - 类型定义

## 相关模块

- `@testring/test-run-controller` - 测试运行控制器
- `@testring/test-worker` - 测试工作进程
- `@testring/cli` - 命令行界面