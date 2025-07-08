# @testring/cli

命令行界面模块，提供了 testring 框架的命令行工具和用户交互功能。

## 功能概述

该模块是 testring 框架的命令行入口，负责：
- 解析命令行参数
- 处理用户输入
- 管理测试运行流程
- 提供命令行帮助信息

## 主要功能

### 命令支持
- **`run`** - 运行测试命令（默认命令）
- **`--help`** - 显示帮助信息
- **`--version`** - 显示版本信息

### 配置选项
支持以下命令行参数：

- `--config` - 自定义配置文件路径
- `--tests` - 测试文件搜索模式（glob 模式）
- `--plugins` - 插件列表
- `--bail` - 测试失败后立即停止
- `--workerLimit` - 并行测试工作进程数量
- `--retryCount` - 重试次数
- `--retryDelay` - 重试延迟时间
- `--logLevel` - 日志级别
- `--envConfig` - 环境配置文件路径
- `--devtool` - 启用开发工具（已弃用）

## 使用方法

### 基本命令
```bash
# 运行测试（默认）
testring
testring run

# 指定测试文件
testring run --tests "./tests/**/*.spec.js"

# 使用自定义配置
testring run --config ./my-config.json

# 设置并行工作进程数
testring run --workerLimit 4

# 设置重试次数
testring run --retryCount 3

# 设置日志级别
testring run --logLevel debug
```

### 插件配置
```bash
# 使用单个插件
testring run --plugins @testring/plugin-selenium-driver

# 使用多个插件
testring run --plugins @testring/plugin-selenium-driver --plugins @testring/plugin-babel
```

### 环境配置
```bash
# 使用环境配置覆盖主配置
testring run --config ./config.json --envConfig ./env.json
```

## 配置文件

### 基本配置文件 (.testringrc)
```json
{
  "tests": "./tests/**/*.spec.js",
  "plugins": [
    "@testring/plugin-selenium-driver",
    "@testring/plugin-babel"
  ],
  "workerLimit": 2,
  "retryCount": 3,
  "retryDelay": 2000,
  "logLevel": "info",
  "bail": false
}
```

### JavaScript 配置文件
```javascript
module.exports = {
  tests: "./tests/**/*.spec.js",
  plugins: [
    "@testring/plugin-selenium-driver"
  ],
  workerLimit: 2,
  // 可以是函数
  retryCount: process.env.CI ? 1 : 3
};
```

### 异步配置文件
```javascript
module.exports = async () => {
  const config = await loadConfiguration();
  return {
    tests: "./tests/**/*.spec.js",
    plugins: config.plugins,
    workerLimit: config.workerLimit
  };
};
```

## 错误处理

CLI 模块提供了完善的错误处理机制：
- 捕获并格式化运行时错误
- 提供详细的错误信息
- 支持优雅的进程退出
- 处理用户中断信号（Ctrl+C）

## 进程管理

支持以下进程信号：
- `SIGINT` - 用户中断（Ctrl+C）
- `SIGUSR1` - 用户信号1
- `SIGUSR2` - 用户信号2
- `SIGHUP` - 终端挂起
- `SIGQUIT` - 退出信号
- `SIGABRT` - 异常终止
- `SIGTERM` - 终止信号

## 安装

```bash
npm install @testring/cli
```

## 依赖

- `yargs` - 命令行参数解析
- `@testring/logger` - 日志记录
- `@testring/cli-config` - 配置管理
- `@testring/transport` - 进程通信
- `@testring/types` - 类型定义

## 相关模块

- `@testring/cli-config` - 配置文件处理
- `@testring/api` - 测试 API
- `@testring/test-run-controller` - 测试运行控制