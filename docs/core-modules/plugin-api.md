# @testring/plugin-api

插件 API 接口模块，为 testring 框架提供统一的插件开发接口和插件管理功能。

## 功能概述

该模块是 testring 插件系统的核心，提供了：
- 统一的插件 API 接口
- 插件生命周期管理
- 模块间的通信桥梁
- 插件初始化和配置功能

## 主要组件

### PluginAPI
插件 API 主类，为插件提供访问框架各模块的统一接口：

```typescript
export class PluginAPI {
  constructor(pluginName: string, modules: IPluginModules)
  
  // 核心模块访问接口
  getLogger(): LoggerAPI
  getFSReader(): FSReaderAPI | null
  getTestWorker(): TestWorkerAPI
  getTestRunController(): TestRunControllerAPI
  getBrowserProxy(): BrowserProxyAPI
  getHttpServer(): HttpServerAPI
  getHttpClient(): IHttpClient
  getFSStoreServer(): FSStoreServerAPI
}
```

### applyPlugins
插件应用函数，负责初始化和应用插件：

```typescript
const applyPlugins = (
  pluginsDestinations: IPluginModules,
  config: IConfig
): void
```

## 安装

```bash
npm install --save-dev @testring/plugin-api
```

或使用 yarn:

```bash
yarn add @testring/plugin-api --dev
```

## 插件开发

### 基本插件结构
```typescript
// my-plugin.ts
export default (pluginAPI: PluginAPI) => {
  const logger = pluginAPI.getLogger();
  const testWorker = pluginAPI.getTestWorker();
  
  // 在测试运行前执行
  testWorker.beforeRun(async () => {
    await logger.info('插件：测试准备开始');
  });
  
  // 在测试运行后执行
  testWorker.afterRun(async () => {
    await logger.info('插件：测试执行完成');
  });
};
```

### 插件配置
```json
{
  "plugins": [
    "./plugins/my-plugin",
    "@my-org/testring-plugin-custom"
  ]
}
```

## 模块 API 详解

### Logger API
用于日志记录和输出：

```typescript
const logger = pluginAPI.getLogger();

// 基本日志记录
await logger.verbose('详细信息');
await logger.debug('调试信息');
await logger.info('一般信息');
await logger.warn('警告信息');
await logger.error('错误信息');
```

### FS Reader API
用于文件系统操作：

```typescript
const fsReader = pluginAPI.getFSReader();

if (fsReader) {
  // 文件解析前处理
  fsReader.beforeResolve(async (files) => {
    // 过滤或修改文件列表
    return files.filter(file => !file.path.includes('temp'));
  });
  
  // 文件解析后处理
  fsReader.afterResolve(async (files) => {
    // 添加额外的文件信息
    return files.map(file => ({
      ...file,
      processed: true
    }));
  });
}
```

### Test Worker API
用于测试工作进程管理：

```typescript
const testWorker = pluginAPI.getTestWorker();

// 测试执行生命周期钩子
testWorker.beforeRun(async () => {
  console.log('准备执行测试');
});

testWorker.afterRun(async () => {
  console.log('测试执行完成');
});

testWorker.beforeTest(async (testPath) => {
  console.log(`开始执行测试: ${testPath}`);
});

testWorker.afterTest(async (testPath) => {
  console.log(`测试执行完成: ${testPath}`);
});
```

### Test Run Controller API
用于测试运行控制：

```typescript
const controller = pluginAPI.getTestRunController();

// 运行前准备
controller.beforeRun(async (files) => {
  console.log(`准备运行 ${files.length} 个测试文件`);
});

// 单个测试前处理
controller.beforeTest(async (test) => {
  console.log(`开始测试: ${test.path}`);
});

// 测试重试处理
controller.beforeTestRetry(async (test, attempt) => {
  console.log(`重试测试: ${test.path}，第 ${attempt} 次`);
});

// 控制测试是否执行
controller.shouldNotExecute(async (files) => {
  // 返回 true 跳过所有测试
  return process.env.SKIP_TESTS === 'true';
});

controller.shouldNotStart(async (test) => {
  // 返回 true 跳过特定测试
  return test.path.includes('.skip.');
});

controller.shouldNotRetry(async (test, error, attempt) => {
  // 返回 true 不重试失败的测试
  return attempt >= 3;
});
```

### Browser Proxy API
用于浏览器代理控制：

```typescript
const browserProxy = pluginAPI.getBrowserProxy();

// 浏览器启动前处理
browserProxy.beforeStart(async () => {
  console.log('准备启动浏览器');
});

// 浏览器停止后处理
browserProxy.afterStop(async () => {
  console.log('浏览器已停止');
});
```

### HTTP Server API
用于 HTTP 服务器管理：

```typescript
const httpServer = pluginAPI.getHttpServer();

// 服务器启动前处理
httpServer.beforeStart(async () => {
  console.log('准备启动 HTTP 服务器');
});

// 服务器停止后处理
httpServer.afterStop(async () => {
  console.log('HTTP 服务器已停止');
});
```

### HTTP Client
用于 HTTP 请求：

```typescript
const httpClient = pluginAPI.getHttpClient();

// 发送 HTTP 请求
const response = await httpClient.get('/api/status');
const data = await httpClient.post('/api/data', { key: 'value' });
```

### FS Store Server API
用于文件存储服务：

```typescript
const fsStore = pluginAPI.getFSStoreServer();

// 文件创建时处理
fsStore.onFileCreated(async (file) => {
  console.log(`文件已创建: ${file.path}`);
});

// 文件释放时处理
fsStore.onFileReleased(async (file) => {
  console.log(`文件已释放: ${file.path}`);
});
```

## 实际插件示例

### 测试报告插件
```typescript
// plugins/test-reporter.ts
export default (pluginAPI) => {
  const logger = pluginAPI.getLogger();
  const controller = pluginAPI.getTestRunController();
  
  let startTime: number;
  let testResults: Array<any> = [];
  
  // 测试开始
  controller.beforeRun(async (files) => {
    startTime = Date.now();
    testResults = [];
    await logger.info(`开始执行 ${files.length} 个测试文件`);
  });
  
  // 单个测试完成
  controller.afterTest(async (test, result) => {
    testResults.push({
      path: test.path,
      success: !result.error,
      duration: result.duration,
      error: result.error
    });
  });
  
  // 所有测试完成
  controller.afterRun(async () => {
    const duration = Date.now() - startTime;
    const passed = testResults.filter(r => r.success).length;
    const failed = testResults.length - passed;
    
    await logger.info(`测试报告:`);
    await logger.info(`  总计: ${testResults.length}`);
    await logger.info(`  通过: ${passed}`);
    await logger.info(`  失败: ${failed}`);
    await logger.info(`  耗时: ${duration}ms`);
  });
};
```

### 截图插件
```typescript
// plugins/screenshot.ts
export default (pluginAPI) => {
  const browserProxy = pluginAPI.getBrowserProxy();
  const fsStore = pluginAPI.getFSStoreServer();
  const logger = pluginAPI.getLogger();
  
  // 测试失败时自动截图
  browserProxy.onTestFailure(async (test, error) => {
    try {
      const screenshot = await browserProxy.takeScreenshot();
      const file = await fsStore.createFile({
        content: screenshot,
        ext: 'png',
        name: `failure-${test.name}-${Date.now()}`
      });
      
      await logger.info(`测试失败截图已保存: ${file.path}`);
    } catch (screenshotError) {
      await logger.error('截图保存失败:', screenshotError);
    }
  });
};
```

### 环境准备插件
```typescript
// plugins/env-setup.ts
export default (pluginAPI) => {
  const testWorker = pluginAPI.getTestWorker();
  const httpClient = pluginAPI.getHttpClient();
  const logger = pluginAPI.getLogger();
  
  // 测试前准备环境
  testWorker.beforeRun(async () => {
    await logger.info('准备测试环境...');
    
    // 清理测试数据
    await httpClient.delete('/api/test-data');
    
    // 初始化测试数据
    await httpClient.post('/api/test-data/init', {
      users: ['testuser1', 'testuser2'],
      settings: { debug: true }
    });
    
    await logger.info('测试环境准备完成');
  });
  
  // 测试后清理环境
  testWorker.afterRun(async () => {
    await logger.info('清理测试环境...');
    await httpClient.delete('/api/test-data');
    await logger.info('测试环境清理完成');
  });
};
```

## 插件管理

### 插件配置
```javascript
// .testringrc
module.exports = {
  plugins: [
    // 本地插件
    './plugins/test-reporter',
    './plugins/screenshot',
    
    // NPM 包插件
    '@testring/plugin-selenium-driver',
    '@mycompany/testring-plugin-custom',
    
    // 带配置的插件
    {
      name: './plugins/env-setup',
      config: {
        apiUrl: 'http://localhost:3000',
        timeout: 5000
      }
    }
  ]
};
```

### 插件加载顺序
插件按照配置中的顺序依次加载和初始化，钩子函数的执行顺序遵循：
- `before*` 钩子：按插件加载顺序执行
- `after*` 钩子：按插件加载顺序反向执行

## 最佳实践

### 插件命名规范
- 使用描述性的插件名称
- 遵循 `testring-plugin-*` 命名规范
- 在插件内部使用有意义的日志前缀

### 错误处理
```typescript
export default (pluginAPI) => {
  const logger = pluginAPI.getLogger();
  
  // 总是处理异步操作的错误
  controller.beforeTest(async (test) => {
    try {
      await setupTest(test);
    } catch (error) {
      await logger.error(`插件错误: ${error.message}`);
      throw error; // 重新抛出以停止测试
    }
  });
};
```

### 资源清理
```typescript
export default (pluginAPI) => {
  let resources: any[] = [];
  
  // 创建资源
  controller.beforeRun(async () => {
    resources = await createResources();
  });
  
  // 确保资源被清理
  controller.afterRun(async () => {
    try {
      await cleanupResources(resources);
    } catch (error) {
      // 记录清理失败，但不影响测试结果
      await logger.warn(`资源清理失败: ${error.message}`);
    }
  });
};
```

## 类型定义

插件开发中用到的主要类型：

```typescript
interface IPluginModules {
  logger: ILogger;
  fsReader?: IFSReader;
  testWorker: ITestWorker;
  testRunController: ITestRunController;
  browserProxy: IBrowserProxy;
  httpServer: IHttpServer;
  httpClientInstance: IHttpClient;
  fsStoreServer: IFSStoreServer;
}

type PluginFunction = (api: PluginAPI) => void | Promise<void>;
```