# testring

Main entry package for the testring framework, providing command-line tools and programmable test API, serving as the unified entry point for the entire testing framework.

[![npm version](https://badge.fury.io/js/testring.svg)](https://www.npmjs.com/package/testring)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The testring main package serves as the entry point for the entire testing framework, responsible for:
- Providing the `testring` command-line tool for test execution
- Exposing a unified `run` API for direct script invocation
- Integrating all core modules with the plugin system
- Managing test execution lifecycle
- Handling configuration files and command-line parameters

## Key Features

### Command Line Interface
- Simple and easy-to-use command-line tool
- Support for multiple configuration methods
- Rich command-line parameters
- Intelligent error prompts

### Programmable API
- Flexible programming interface
- Support for asynchronous operations
- Complete lifecycle management
- Plugin system integration

### Multi-Process Support
- Parallel test execution
- Inter-process communication
- Load balancing
- Error isolation

## Installation

### Using npm
```bash
npm install --save-dev testring
```

### Using yarn
```bash
yarn add testring --dev
```

### Using pnpm
```bash
pnpm add testring --dev
```

## Quick Start

### 1. Create Configuration File

Create `.testringrc` file:

```json
{
  "tests": "./tests/**/*.spec.js",
  "plugins": [
    "@testring/plugin-selenium-driver"
  ],
  "workerLimit": 2,
  "retryCount": 3,
  "logLevel": "info"
}
```

### 2. Write Test File

Create `tests/example.spec.js`:

```javascript
describe('Example Test', () => {
  it('should pass basic test', async () => {
    await browser.url('https://example.com');
    const title = await browser.getTitle();
    expect(title).toBe('Example Domain');
  });
});
```

### 3. Run Tests

```bash
npx testring
```

## 命令行使用

### 基本命令

```bash
# 运行测试（使用默认配置）
testring

# 显式运行测试
testring run

# 显示帮助信息
testring --help

# 显示版本信息
testring --version
```

### 常用参数

#### 测试文件配置
```bash
# 指定测试文件路径
testring run --tests "./tests/**/*.spec.js"

# 指定多个测试路径
testring run --tests "./unit/**/*.test.js" --tests "./e2e/**/*.spec.js"

# 使用配置文件
testring run --config ./custom-config.json
```

#### 并发控制
```bash
# 设置并行工作进程数
testring run --workerLimit 4

# 单进程运行（调试时有用）
testring run --workerLimit 1
```

#### 重试机制
```bash
# 设置重试次数
testring run --retryCount 3

# 设置重试延迟（毫秒）
testring run --retryDelay 2000
```

#### 日志控制
```bash
# 设置日志级别
testring run --logLevel debug

# 静默模式
testring run --logLevel silent

# 详细输出
testring run --logLevel verbose
```

#### 插件配置
```bash
# 使用插件
testring run --plugins @testring/plugin-selenium-driver

# 使用多个插件
testring run --plugins @testring/plugin-selenium-driver --plugins @testring/plugin-babel
```

#### 环境配置
```bash
# 使用环境配置文件
testring run --envConfig ./env/staging.json

# 同时使用主配置和环境配置
testring run --config ./base-config.json --envConfig ./env/production.json
```

### 高级参数

```bash
# 测试失败后立即停止
testring run --bail

# 启用调试模式
testring run --debug

# 设置超时时间
testring run --timeout 30000

# 过滤测试文件
testring run --grep "login"

# 排除某些测试
testring run --exclude "**/skip/**"
```

## 编程 API

### 基本用法

```typescript
import { run } from 'testring';

// 使用默认配置运行测试
await run();

// 使用自定义配置
await run({
  tests: './tests/**/*.spec.js',
  workerLimit: 2,
  retryCount: 3,
  logLevel: 'info'
});
```

### 高级配置

```typescript
import { run } from 'testring';

await run({
  // 测试文件配置
  tests: [
    './tests/unit/**/*.spec.js',
    './tests/integration/**/*.spec.js'
  ],
  
  // 插件配置
  plugins: [
    '@testring/plugin-selenium-driver',
    '@testring/plugin-babel',
    './custom-plugin.js'
  ],
  
  // 执行配置
  workerLimit: 4,
  retryCount: 3,
  retryDelay: 2000,
  timeout: 30000,
  bail: false,
  
  // 日志配置
  logLevel: 'info',
  silent: false,
  
  // 浏览器配置
  browserOptions: {
    headless: true,
    width: 1920,
    height: 1080
  },
  
  // 环境配置
  envConfig: './env/staging.json'
});
```

### 异步操作

```typescript
import { run } from 'testring';

async function runTests() {
  try {
    const result = await run({
      tests: './tests/**/*.spec.js',
      workerLimit: 2
    });
    
    console.log('测试运行完成:', result);
  } catch (error) {
    console.error('测试运行失败:', error);
    process.exit(1);
  }
}

runTests();
```

### 生命周期钩子

```typescript
import { run } from 'testring';

await run({
  tests: './tests/**/*.spec.js',
  
  // 测试开始前
  beforeRun: async () => {
    console.log('准备开始测试');
    await setupTestData();
  },
  
  // 测试完成后
  afterRun: async () => {
    console.log('测试执行完毕');
    await cleanupTestData();
  },
  
  // 测试失败时
  onError: async (error) => {
    console.error('测试执行失败:', error);
    await sendFailureNotification(error);
  }
});
```

## 配置文件

### JSON 配置文件

`.testringrc`:
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
  "bail": false,
  "timeout": 30000,
  "browserOptions": {
    "headless": true,
    "width": 1920,
    "height": 1080
  }
}
```

### JavaScript 配置文件

`.testringrc.js`:
```javascript
module.exports = {
  tests: './tests/**/*.spec.js',
  plugins: [
    '@testring/plugin-selenium-driver'
  ],
  workerLimit: process.env.CI ? 1 : 2,
  retryCount: process.env.CI ? 1 : 3,
  logLevel: process.env.DEBUG ? 'debug' : 'info',
  
  // 动态配置
  browserOptions: {
    headless: !process.env.SHOW_BROWSER,
    width: parseInt(process.env.BROWSER_WIDTH) || 1920,
    height: parseInt(process.env.BROWSER_HEIGHT) || 1080
  }
};
```

### 异步配置文件

```javascript
module.exports = async () => {
  const config = await loadConfigFromAPI();
  
  return {
    tests: './tests/**/*.spec.js',
    plugins: config.plugins,
    workerLimit: config.workerLimit,
    
    // 从外部服务获取配置
    browserOptions: await getBrowserConfig()
  };
};
```

### 环境特定配置

主配置文件 `config.json`:
```json
{
  "tests": "./tests/**/*.spec.js",
  "plugins": ["@testring/plugin-selenium-driver"],
  "logLevel": "info"
}
```

开发环境配置 `env/dev.json`:
```json
{
  "workerLimit": 1,
  "logLevel": "debug",
  "browserOptions": {
    "headless": false
  }
}
```

生产环境配置 `env/prod.json`:
```json
{
  "workerLimit": 4,
  "retryCount": 1,
  "browserOptions": {
    "headless": true
  }
}
```

使用环境配置：
```bash
# 开发环境
testring run --config config.json --envConfig env/dev.json

# 生产环境
testring run --config config.json --envConfig env/prod.json
```

## 插件系统

### 使用现有插件

```bash
# 安装 Selenium 驱动插件
npm install @testring/plugin-selenium-driver

# 在配置中使用
testring run --plugins @testring/plugin-selenium-driver
```

### 自定义插件

创建自定义插件 `my-plugin.js`:
```javascript
module.exports = (pluginAPI) => {
  const logger = pluginAPI.getLogger();
  
  // 在测试开始前执行
  pluginAPI.beforeRun(() => {
    logger.info('自定义插件：测试开始');
  });
  
  // 在测试完成后执行
  pluginAPI.afterRun(() => {
    logger.info('自定义插件：测试完成');
  });
};
```

使用自定义插件：
```json
{
  "plugins": ["./my-plugin.js"]
}
```

## 实际应用场景

### CI/CD 集成

```yaml
# GitHub Actions 示例
name: 测试
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: 安装依赖
      run: npm ci
    
    - name: 运行测试
      run: npx testring run --workerLimit 2 --retryCount 1
```

### Docker 环境

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# 运行测试
CMD ["npx", "testring", "run", "--workerLimit", "1"]
```

### 多环境测试

```javascript
// test-runner.js
import { run } from 'testring';

const environments = ['dev', 'staging', 'prod'];

for (const env of environments) {
  console.log(`运行 ${env} 环境测试`);
  
  await run({
    tests: './tests/**/*.spec.js',
    envConfig: `./env/${env}.json`,
    workerLimit: env === 'prod' ? 4 : 2
  });
}
```

### 分布式测试

```javascript
// 主节点
import { run } from 'testring';

await run({
  tests: './tests/**/*.spec.js',
  workerLimit: 8,
  
  // 分布式配置
  cluster: {
    nodes: ['node1:3000', 'node2:3000', 'node3:3000'],
    master: true
  }
});
```

## 性能优化

### 并发控制

```typescript
// 根据 CPU 核心数调整并发
import os from 'os';

const workerLimit = Math.min(os.cpus().length, 4);

await run({
  tests: './tests/**/*.spec.js',
  workerLimit
});
```

### 内存管理

```typescript
await run({
  tests: './tests/**/*.spec.js',
  
  // 限制内存使用
  memoryLimit: '2GB',
  
  // 垃圾回收配置
  gcOptions: {
    maxOldSpaceSize: 4096,
    maxSemiSpaceSize: 256
  }
});
```

### 缓存优化

```typescript
await run({
  tests: './tests/**/*.spec.js',
  
  // 启用文件缓存
  cache: {
    enabled: true,
    directory: './.test-cache',
    maxAge: 3600000 // 1小时
  }
});
```

## 错误处理

### 常见错误

#### 配置文件错误
```bash
Error: Configuration file not found: .testringrc
```
解决方案：创建配置文件或使用 `--config` 参数指定配置文件路径。

#### 测试文件未找到
```bash
Error: No test files found matching pattern: ./tests/**/*.spec.js
```
解决方案：检查测试文件路径是否正确，确认文件存在。

#### 插件加载失败
```bash
Error: Plugin not found: @testring/plugin-selenium-driver
```
解决方案：安装缺失的插件包。

### 错误恢复

```typescript
import { run } from 'testring';

async function runWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await run({
        tests: './tests/**/*.spec.js',
        workerLimit: 2
      });
      
      console.log('测试运行成功');
      return;
    } catch (error) {
      console.error(`测试运行失败 (尝试 ${i + 1}/${maxRetries}):`, error);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
```

### 调试模式

```bash
# 启用详细日志
testring run --logLevel debug

# 单进程运行（便于调试）
testring run --workerLimit 1

# 保留浏览器窗口
testring run --browserOptions.headless=false
```

## 监控和报告

### 测试报告

```typescript
await run({
  tests: './tests/**/*.spec.js',
  
  // 生成报告
  reporters: [
    'console',
    'html',
    'junit',
    'allure'
  ],
  
  // 报告配置
  reporterOptions: {
    html: {
      outputDir: './reports/html'
    },
    junit: {
      outputFile: './reports/junit.xml'
    }
  }
});
```

### 性能监控

```typescript
await run({
  tests: './tests/**/*.spec.js',
  
  // 性能监控
  monitoring: {
    enabled: true,
    
    // 收集性能指标
    metrics: ['memory', 'cpu', 'duration'],
    
    // 报告阈值
    thresholds: {
      memory: '1GB',
      duration: 300000 // 5分钟
    }
  }
});
```

## 最佳实践

### 1. 项目结构
```
project/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── config/
│   ├── base.json
│   ├── dev.json
│   └── prod.json
├── .testringrc
└── package.json
```

### 2. 配置管理
- 使用环境特定的配置文件
- 将敏感信息存储在环境变量中
- 使用配置验证确保配置正确性

### 3. 性能优化
- 根据硬件资源调整并发数
- 使用适当的重试策略
- 启用缓存机制

### 4. 错误处理
- 实现完善的错误捕获机制
- 提供详细的错误信息
- 使用适当的退出码

### 5. 可维护性
- 使用有意义的测试文件命名
- 保持配置文件的简洁性
- 定期更新插件和依赖

## 故障排除

### 性能问题
- 检查内存使用情况
- 调整并发进程数
- 优化测试文件大小

### 兼容性问题
- 确认 Node.js 版本兼容性
- 检查插件版本兼容性
- 验证浏览器驱动版本

### 网络问题
- 配置代理设置
- 调整超时时间
- 使用重试机制

## 依赖

### 核心依赖
- `@testring/api` - 测试 API 控制器
- `@testring/cli` - 命令行界面

### 可选插件
- `@testring/plugin-selenium-driver` - Selenium WebDriver 支持
- `@testring/plugin-playwright-driver` - Playwright 支持
- `@testring/plugin-babel` - Babel 转译支持

## 相关资源

- [GitHub 仓库](https://github.com/ringcentral/testring)
- [API 文档](../api/README.md)
- [CLI 文档](cli.md)
- [插件开发指南](../guides/plugin-development.md)
- [配置参考](../configuration/README.md)

## 贡献

欢迎贡献代码！请参考项目的贡献指南。

## 许可证

MIT License

