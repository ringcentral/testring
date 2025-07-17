# @testring/cli-config

Command-line configuration management module that serves as the configuration center for the testring framework. It handles parsing command-line arguments, reading configuration files, and generating the final runtime configuration. This module provides a flexible configuration management mechanism with priority-based merging from multiple configuration sources, ensuring precise test environment configuration.

[![npm version](https://badge.fury.io/js/@testring/cli-config.svg)](https://www.npmjs.com/package/@testring/cli-config)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The command-line configuration management module is the configuration foundation of the testring framework, providing:
- Intelligent command-line argument parsing and processing
- Multi-format configuration file support (JSON, JavaScript)
- Layered configuration merging mechanism and priority management
- Automatic detection of environment variables and debug state
- Special handling logic for plugin configurations
- Configuration file inheritance and extension mechanism

## Key Features

### Command-Line Parsing
- Powerful argument parsing capabilities based on yargs
- Automatic kebab-case to camelCase conversion
- Support for complex nested parameter structures
- Parameter type validation and normalization

### Configuration File Support
- JSON format static configuration files
- JavaScript format dynamic configuration files
- Asynchronous configuration function support
- Configuration file inheritance (@extend syntax)

### Configuration Merging
- Multi-level configuration priority management
- Deep merge algorithms
- Special handling for plugin configurations
- Environment-aware configuration selection

### Debug and Environment Detection
- Automatic detection of Node.js debug mode
- Environment variable passing and processing
- Detailed logging of configuration loading process

## Installation

```bash
npm install @testring/cli-config
```

## Core Architecture

### getConfig Function
The main configuration retrieval function that provides complete configuration parsing and merging:

```typescript
async function getConfig(argv: Array<string> = []): Promise<IConfig>
```

### Configuration Processing Flow
1. **Command-line argument parsing** - Parse input parameters using yargs
2. **Debug state detection** - Automatically detect Node.js debug mode
3. **Temporary configuration generation** - Merge default configuration and command-line arguments
4. **Environment configuration loading** - Read environment-specific configuration files
5. **Main configuration loading** - Read main configuration files
6. **Final configuration merging** - Merge all configuration sources by priority

## Basic Usage

### Simple Configuration Retrieval

```typescript
import { getConfig } from '@testring/cli-config';

// Get default configuration
const config = await getConfig();
console.log('Default configuration:', config);

// Get configuration from command-line arguments
const config = await getConfig(process.argv.slice(2));
console.log('Command-line configuration:', config);
```

### Usage in CLI Applications

```typescript
import { getConfig } from '@testring/cli-config';

async function main() {
  try {
    const config = await getConfig(process.argv.slice(2));

    console.log('Test file pattern:', config.tests);
    console.log('Worker limit:', config.workerLimit);
    console.log('Retry count:', config.retryCount);
    console.log('Plugin list:', config.plugins);

    // Start tests using configuration
    await startTests(config);
  } catch (error) {
    console.error('Configuration loading failed:', error.message);
    process.exit(1);
  }
}

main();
```

### Integration in Test Framework

```typescript
import { getConfig } from '@testring/cli-config';
import { TestRunner } from '@testring/test-runner';

class TestFramework {
  private config: IConfig;

  async initialize(argv: string[]) {
    this.config = await getConfig(argv);

    // Initialize components based on configuration
    this.setupLogger(this.config.logLevel);
    this.setupWorkers(this.config.workerLimit);
    this.setupPlugins(this.config.plugins);
  }

  async run() {
    const runner = new TestRunner(this.config);
    return await runner.execute();
  }
}
```

## Configuration File Formats

### JSON Configuration File

```json
// .testringrc.json
{
  "tests": "./tests/**/*.spec.js",
  "plugins": [
    "@testring/plugin-selenium-driver",
    ["@testring/plugin-babel", {
      "presets": ["@babel/preset-env"]
    }]
  ],
  "workerLimit": 2,
  "retryCount": 3,
  "retryDelay": 2000,
  "logLevel": "info",
  "screenshots": "afterError",
  "screenshotPath": "./screenshots/"
}
```

### JavaScript Configuration File

```javascript
// .testringrc.js - Static configuration object
module.exports = {
  tests: './tests/**/*.spec.js',
  plugins: ['@testring/plugin-selenium-driver'],
  workerLimit: 2,
  retryCount: 3,
  logLevel: 'info',
  envParameters: {
    baseUrl: 'http://localhost:3000'
  }
};
```

### Dynamic Configuration Function

```javascript
// .testringrc.js - Asynchronous configuration function
module.exports = async (baseConfig, env) => {
  // Dynamic configuration based on environment variables
  const isCI = env.CI === 'true';
  const isDev = env.NODE_ENV === 'development';

  return {
    tests: './tests/**/*.spec.js',
    plugins: [
      '@testring/plugin-selenium-driver',
      ...(isDev ? ['@testring/plugin-devtools'] : [])
    ],
    workerLimit: isCI ? 1 : 4,
    retryCount: isCI ? 1 : 3,
    retryDelay: isCI ? 1000 : 2000,
    logLevel: isDev ? 'debug' : 'info',
    screenshots: isCI ? 'disable' : 'afterError',
    envParameters: {
      baseUrl: env.BASE_URL || 'http://localhost:3000',
      timeout: parseInt(env.TIMEOUT) || 30000
    }
  };
};
```

### Configuration File Inheritance

```javascript
// base.config.js
module.exports = {
  tests: './tests/**/*.spec.js',
  plugins: ['@testring/plugin-selenium-driver'],
  workerLimit: 2,
  retryCount: 3,
  logLevel: 'info'
};
```

```json
// .testringrc.json
{
  "@extend": "./base.config.js",
  "workerLimit": 4,
  "retryCount": 5,
  "envParameters": {
    "baseUrl": "https://staging.example.com"
  }
}
```

## 命令行参数

### 基础参数

```bash
# 指定测试文件
--tests "./tests/**/*.spec.js"

# 设置工作进程数
--worker-limit 4

# 配置重试
--retry-count 3
--retry-delay 2000

# 日志级别
--log-level debug

# 调试模式
--debug
```

### 配置文件参数

```bash
# 指定主配置文件
--config ./custom.config.js

# 指定环境配置文件
--env-config ./env.staging.js

# 合并多个配置源
--config ./base.config.js --env-config ./env.local.js --worker-limit 2
```

### 插件参数

```bash
# 指定插件
--plugins @testring/plugin-selenium-driver

# 多个插件
--plugins @testring/plugin-selenium-driver --plugins @testring/plugin-babel

# 复杂参数结构
--plugins.0 @testring/plugin-selenium-driver
--plugins.1.0 @testring/plugin-babel
--plugins.1.1.presets.0 @babel/preset-env
```

### 环境参数

```bash
# 传递环境参数
--env-parameters.baseUrl "https://api.example.com"
--env-parameters.timeout 30000
--env-parameters.apiKey "your-api-key"
```

## 配置优先级

配置合并按以下优先级进行（后面的覆盖前面的）：

1. **默认配置** (`defaultConfiguration`)
2. **环境配置文件** (`--envConfig` 指定的文件)
3. **主配置文件** (`--config` 指定的文件)
4. **命令行参数** (直接传入的参数)
5. **调试状态** (自动检测的调试模式)

### 优先级示例

```typescript
// 1. 默认配置
const defaultConfig = {
  workerLimit: 1,
  retryCount: 3,
  logLevel: 'info'
};

// 2. 环境配置文件 (env.config.js)
const envConfig = {
  workerLimit: 2,
  retryCount: 5
};

// 3. 主配置文件 (.testringrc.js)
const mainConfig = {
  workerLimit: 4,
  screenshots: 'afterError'
};

// 4. 命令行参数
const cliArgs = {
  retryCount: 2,
  logLevel: 'debug'
};

// 5. 调试状态
const debugInfo = {
  debug: true
};

// 最终合并结果
const finalConfig = {
  workerLimit: 4,      // 来自主配置文件
  retryCount: 2,       // 来自命令行参数
  logLevel: 'debug',   // 来自命令行参数
  screenshots: 'afterError',  // 来自主配置文件
  debug: true          // 来自调试检测
};
```

## 默认配置

```typescript
export const defaultConfiguration: IConfig = {
  devtool: false,                    // 不启用开发工具
  tests: './tests/**/*.js',          // 测试文件模式
  restartWorker: false,              // 不重启工作进程
  screenshots: 'disable',           // 禁用截图
  screenshotPath: './_tmp/',         // 截图保存路径
  config: '.testringrc',             // 默认配置文件
  debug: false,                      // 调试模式
  silent: false,                     // 非静默模式
  bail: false,                       // 不快速失败
  workerLimit: 1,                    // 单工作进程
  maxWriteThreadCount: 2,            // 最大写入线程数
  plugins: [],                       // 空插件列表
  retryCount: 3,                     // 重试3次
  retryDelay: 2000,                  // 重试延迟2秒
  testTimeout: 15 * 60 * 1000,       // 测试超时15分钟
  logLevel: LogLevel.info,           // 信息级别日志
  envParameters: {},                 // 空环境参数
  httpThrottle: 0,                   // 不限制HTTP请求
};
```

## 高级用法

### 环境特定配置

```typescript
// 创建多环境配置管理器
class ConfigManager {
  private configs = new Map<string, IConfig>();
  
  async loadEnvironmentConfig(env: string, argv: string[]) {
    if (this.configs.has(env)) {
      return this.configs.get(env);
    }
    
    // 根据环境设置配置文件路径
    const envConfigPath = `./config/${env}.config.js`;
    const argsWithEnvConfig = [...argv, '--env-config', envConfigPath];
    
    const config = await getConfig(argsWithEnvConfig);
    this.configs.set(env, config);
    
    return config;
  }
  
  async getConfig(env: string = 'development', argv: string[] = []) {
    return await this.loadEnvironmentConfig(env, argv);
  }
}

// 使用示例
const configManager = new ConfigManager();

// 开发环境配置
const devConfig = await configManager.getConfig('development', process.argv.slice(2));

// 生产环境配置
const prodConfig = await configManager.getConfig('production', process.argv.slice(2));

// 测试环境配置
const testConfig = await configManager.getConfig('test', process.argv.slice(2));
```

### 配置验证和规范化

```typescript
import { getConfig } from '@testring/cli-config';

class ConfigValidator {
  async validateAndNormalizeConfig(argv: string[]) {
    const config = await getConfig(argv);
    
    // 验证必要字段
    this.validateRequiredFields(config);
    
    // 规范化配置值
    this.normalizeConfig(config);
    
    // 验证配置合理性
    this.validateConfigLogic(config);
    
    return config;
  }
  
  private validateRequiredFields(config: IConfig) {
    if (!config.tests) {
      throw new Error('测试文件模式 (tests) 是必需的');
    }
    
    if (typeof config.workerLimit !== 'number' && config.workerLimit !== 'local') {
      throw new Error('工作进程数 (workerLimit) 必须是数字或 "local"');
    }
  }
  
  private normalizeConfig(config: IConfig) {
    // 规范化路径
    if (config.screenshotPath && !config.screenshotPath.endsWith('/')) {
      config.screenshotPath += '/';
    }
    
    // 规范化数值
    if (config.retryCount < 0) {
      config.retryCount = 0;
    }
    
    if (config.retryDelay < 0) {
      config.retryDelay = 0;
    }
    
    // 规范化插件配置
    config.plugins = config.plugins.map(plugin => {
      if (typeof plugin === 'string') {
        return plugin;
      }
      return [plugin[0], plugin[1] || {}];
    });
  }
  
  private validateConfigLogic(config: IConfig) {
    // 验证工作进程数的合理性
    if (typeof config.workerLimit === 'number' && config.workerLimit > 16) {
      console.warn('工作进程数过多可能导致性能问题');
    }
    
    // 验证超时时间
    if (config.testTimeout < 1000) {
      console.warn('测试超时时间过短可能导致误判');
    }
    
    // 验证重试配置
    if (config.retryCount > 5) {
      console.warn('重试次数过多可能延长测试时间');
    }
  }
}
```

### 动态配置修改

```typescript
import { getConfig } from '@testring/cli-config';

class DynamicConfigManager {
  private baseConfig: IConfig;
  
  async initialize(argv: string[]) {
    this.baseConfig = await getConfig(argv);
  }
  
  // 根据测试阶段动态调整配置
  getPhaseConfig(phase: 'smoke' | 'regression' | 'performance') {
    const config = { ...this.baseConfig };
    
    switch (phase) {
      case 'smoke':
        config.tests = './tests/smoke/**/*.spec.js';
        config.workerLimit = 1;
        config.retryCount = 1;
        config.screenshots = 'disable';
        break;
        
      case 'regression':
        config.tests = './tests/**/*.spec.js';
        config.workerLimit = 4;
        config.retryCount = 3;
        config.screenshots = 'afterError';
        break;
        
      case 'performance':
        config.tests = './tests/performance/**/*.spec.js';
        config.workerLimit = 1;
        config.retryCount = 0;
        config.screenshots = 'disable';
        config.testTimeout = 5 * 60 * 1000; // 5分钟
        break;
    }
    
    return config;
  }
  
  // 根据资源情况动态调整
  getResourceOptimizedConfig() {
    const config = { ...this.baseConfig };
    const totalMem = process.memoryUsage().heapTotal;
    const cpuCount = require('os').cpus().length;
    
    // 根据内存调整工作进程数
    if (totalMem < 1024 * 1024 * 1024) { // 小于1GB
      config.workerLimit = 1;
    } else if (totalMem < 2048 * 1024 * 1024) { // 小于2GB
      config.workerLimit = Math.min(2, cpuCount);
    } else {
      config.workerLimit = Math.min(4, cpuCount);
    }
    
    return config;
  }
}
```

## 插件配置处理

### 插件配置格式

```typescript
// 简单插件配置
const plugins = [
  '@testring/plugin-selenium-driver',
  '@testring/plugin-babel'
];

// 复杂插件配置
const plugins = [
  '@testring/plugin-selenium-driver',
  ['@testring/plugin-babel', {
    presets: ['@babel/preset-env'],
    plugins: ['@babel/plugin-transform-runtime']
  }],
  ['@testring/plugin-custom', {
    option1: 'value1',
    option2: {
      nested: 'value'
    }
  }]
];
```

### 插件合并逻辑

```typescript
// 合并前的插件配置
const basePlugins = [
  '@testring/plugin-selenium-driver',
  ['@testring/plugin-babel', { presets: ['@babel/preset-env'] }]
];

const additionalPlugins = [
  ['@testring/plugin-babel', { plugins: ['@babel/plugin-transform-runtime'] }],
  '@testring/plugin-custom'
];

// 合并后的结果
const mergedPlugins = [
  '@testring/plugin-selenium-driver',
  ['@testring/plugin-babel', {
    presets: ['@babel/preset-env'],
    plugins: ['@babel/plugin-transform-runtime']
  }],
  '@testring/plugin-custom'
];
```

### 插件配置验证

```typescript
class PluginConfigValidator {
  validatePluginConfig(plugins: any[]) {
    return plugins.map(plugin => {
      if (typeof plugin === 'string') {
        return this.validatePluginName(plugin);
      }
      
      if (Array.isArray(plugin)) {
        const [name, config] = plugin;
        return [
          this.validatePluginName(name),
          this.validatePluginOptions(name, config)
        ];
      }
      
      throw new Error(`无效的插件配置: ${JSON.stringify(plugin)}`);
    });
  }
  
  private validatePluginName(name: string) {
    if (!name || typeof name !== 'string') {
      throw new Error('插件名称必须是非空字符串');
    }
    
    if (!name.startsWith('@testring/')) {
      console.warn(`插件 ${name} 不是官方插件`);
    }
    
    return name;
  }
  
  private validatePluginOptions(name: string, options: any) {
    if (options === null || options === undefined) {
      return {};
    }
    
    if (typeof options !== 'object') {
      throw new Error(`插件 ${name} 的配置必须是对象`);
    }
    
    return options;
  }
}
```

## 错误处理

### 配置加载错误

```typescript
import { getConfig } from '@testring/cli-config';

async function safeGetConfig(argv: string[]) {
  try {
    return await getConfig(argv);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('配置文件语法错误:', error.message);
      console.error('请检查配置文件的语法是否正确');
    } else if (error.message.includes('not found')) {
      console.error('配置文件未找到:', error.message);
      console.error('请确认配置文件路径是否正确');
    } else {
      console.error('配置加载失败:', error.message);
    }
    
    // 返回默认配置
    return await getConfig([]);
  }
}
```

### 配置验证错误

```typescript
class ConfigErrorHandler {
  handleConfigError(error: Error, argv: string[]) {
    console.error('配置错误:', error.message);
    
    if (error.message.includes('Config file') && error.message.includes('can\'t be parsed')) {
      console.error('配置文件解析失败，请检查语法');
      console.error('支持的格式: JSON (.json) 和 JavaScript (.js)');
      
      // 提供修复建议
      this.suggestConfigFix(argv);
    } else if (error.message.includes('not supported')) {
      console.error('不支持的配置文件格式');
      console.error('请使用 .json 或 .js 格式的配置文件');
    } else {
      console.error('详细错误信息:', error.stack);
    }
  }
  
  private suggestConfigFix(argv: string[]) {
    console.log('\n修复建议:');
    console.log('1. 检查配置文件的语法是否正确');
    console.log('2. 确认 JSON 文件格式是否有效');
    console.log('3. 确认 JavaScript 文件是否正确导出配置');
    console.log('4. 使用 --config 参数指定正确的配置文件路径');
    
    // 尝试找到配置文件
    const configArg = argv.find(arg => arg.startsWith('--config'));
    if (configArg) {
      const configPath = configArg.split('=')[1] || argv[argv.indexOf(configArg) + 1];
      console.log(`当前配置文件路径: ${configPath}`);
    }
  }
}
```

## 性能优化

### 配置缓存

```typescript
class ConfigCache {
  private cache = new Map<string, IConfig>();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟
  
  async getCachedConfig(argv: string[]): Promise<IConfig> {
    const key = this.generateCacheKey(argv);
    const cached = this.cache.get(key);
    
    if (cached && this.isCacheValid(key)) {
      return cached;
    }
    
    const config = await getConfig(argv);
    this.cache.set(key, config);
    this.setCacheTimestamp(key);
    
    return config;
  }
  
  private generateCacheKey(argv: string[]): string {
    return Buffer.from(argv.join('|')).toString('base64');
  }
  
  private isCacheValid(key: string): boolean {
    const timestamp = this.getCacheTimestamp(key);
    return timestamp && (Date.now() - timestamp) < this.cacheTimeout;
  }
  
  private setCacheTimestamp(key: string): void {
    this.cache.set(`${key}:timestamp`, Date.now() as any);
  }
  
  private getCacheTimestamp(key: string): number | null {
    return this.cache.get(`${key}:timestamp`) as number || null;
  }
}
```

### 异步配置加载

```typescript
class AsyncConfigLoader {
  private configPromise: Promise<IConfig> | null = null;
  
  async getConfig(argv: string[]): Promise<IConfig> {
    if (this.configPromise) {
      return this.configPromise;
    }
    
    this.configPromise = this.loadConfig(argv);
    
    try {
      return await this.configPromise;
    } finally {
      this.configPromise = null;
    }
  }
  
  private async loadConfig(argv: string[]): Promise<IConfig> {
    // 并行加载配置组件
    const [args, debugInfo] = await Promise.all([
      this.parseArguments(argv),
      this.detectDebugMode()
    ]);
    
    const tempConfig = this.mergeConfigs(args, debugInfo);
    
    // 并行加载配置文件
    const [envConfig, mainConfig] = await Promise.all([
      this.loadEnvConfig(tempConfig),
      this.loadMainConfig(tempConfig)
    ]);
    
    return this.mergeConfigs(envConfig, mainConfig, args, debugInfo);
  }
  
  private async parseArguments(argv: string[]): Promise<Partial<IConfig>> {
    // 异步参数解析逻辑
    return new Promise(resolve => {
      setImmediate(() => {
        resolve(getArguments(argv));
      });
    });
  }
  
  private async detectDebugMode(): Promise<{ debug: boolean }> {
    return new Promise(resolve => {
      setImmediate(() => {
        resolve({ debug: !!inspector.url() });
      });
    });
  }
}
```

## 调试和监控

### 配置加载日志

```typescript
import { getConfig } from '@testring/cli-config';

// 启用详细日志
process.env.DEBUG = 'testring:config';

async function debugConfig(argv: string[]) {
  console.log('开始加载配置...');
  console.log('命令行参数:', argv);
  
  const config = await getConfig(argv);
  
  console.log('最终配置:');
  console.log(JSON.stringify(config, null, 2));
  
  // 分析配置来源
  console.log('\n配置来源分析:');
  console.log('- 默认配置: 提供基础配置');
  console.log('- 环境配置:', config.envConfig || '未指定');
  console.log('- 主配置文件:', config.config || '未指定');
  console.log('- 命令行参数:', argv.length > 0 ? '已提供' : '未提供');
  console.log('- 调试模式:', config.debug ? '已启用' : '未启用');
  
  return config;
}
```

### 配置差异分析

```typescript
class ConfigDiffer {
  async compareConfigs(argv1: string[], argv2: string[]) {
    const [config1, config2] = await Promise.all([
      getConfig(argv1),
      getConfig(argv2)
    ]);
    
    const differences = this.findDifferences(config1, config2);
    
    console.log('配置差异分析:');
    console.log('参数1:', argv1.join(' '));
    console.log('参数2:', argv2.join(' '));
    console.log('\n差异项:');
    
    differences.forEach(diff => {
      console.log(`  ${diff.key}: ${diff.value1} → ${diff.value2}`);
    });
    
    return differences;
  }
  
  private findDifferences(config1: IConfig, config2: IConfig) {
    const differences: Array<{
      key: string;
      value1: any;
      value2: any;
    }> = [];
    
    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
    
    for (const key of allKeys) {
      const value1 = config1[key];
      const value2 = config2[key];
      
      if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        differences.push({
          key,
          value1,
          value2
        });
      }
    }
    
    return differences;
  }
}
```

## 最佳实践

### 1. 配置文件组织
- 使用分层配置结构（base → env → local）
- 将敏感信息放在环境变量中
- 使用 TypeScript 提供配置类型检查
- 定期验证配置文件的有效性

### 2. 环境管理
- 为不同环境创建专用配置文件
- 使用环境变量控制配置选择
- 避免在配置文件中硬编码环境特定值
- 提供配置文件模板和示例

### 3. 性能优化
- 缓存配置加载结果
- 并行加载配置文件
- 避免重复的配置解析
- 使用异步配置函数进行复杂计算

### 4. 错误处理
- 提供详细的错误信息和修复建议
- 实现配置验证和规范化
- 提供配置回退机制
- 记录配置加载过程的日志

### 5. 调试和监控
- 启用详细的配置加载日志
- 提供配置差异分析工具
- 监控配置加载性能
- 提供配置可视化工具

## 故障排除

### 常见问题

#### 配置文件语法错误
```bash
Error: Config file .testringrc can't be parsed: invalid JSON
```
解决方案：检查 JSON 语法，确保所有括号、引号正确配对。

#### 配置文件未找到
```bash
Error: Config .testringrc not found
```
解决方案：确认配置文件路径正确，或使用 `--config` 参数指定配置文件。

#### 插件配置错误
```bash
Error: Invalid plugin configuration
```
解决方案：检查插件配置格式，确保插件名称和配置对象正确。

#### 环境配置加载失败
```bash
Error: Environment config file not found
```
解决方案：确认环境配置文件存在，或移除 `--env-config` 参数。

### 调试技巧

```typescript
// 启用详细日志
process.env.DEBUG = 'testring:*';

// 配置加载调试
const config = await getConfig(['--debug', '--log-level', 'debug']);

// 输出配置信息
console.log('配置详情:', JSON.stringify(config, null, 2));
```

## Dependencies

- `yargs` - Command-line argument parsing
- `deepmerge` - Deep configuration merging
- `@testring/logger` - Logging functionality
- `@testring/types` - Type definitions
- `@testring/utils` - Utility functions

## Related Modules

- `@testring/cli` - Command-line interface
- `@testring/logger` - Logging functionality
- `@testring/types` - Type definitions

## License

MIT License
