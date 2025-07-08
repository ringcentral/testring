# @testring/api

测试 API 控制器模块，提供了 testring 框架的核心 API 接口和测试执行控制功能。

## 功能概述

该模块是 testring 框架的核心 API 层，负责：
- 提供测试运行的主要入口点和生命周期管理
- 管理测试状态、参数和环境变量
- 处理测试事件的发布和订阅
- 提供测试上下文和工具（HTTP客户端、Web应用等）
- 集成异步断点和日志记录功能

## 主要特性

### 测试生命周期管理
- **完整的测试生命周期控制**：从测试开始到结束的全过程管理
- **回调机制**：支持beforeRun和afterRun回调注册
- **异步断点支持**：与@testring/async-breakpoints集成

### 测试状态管理
- **测试ID管理**：唯一标识每个测试
- **参数管理**：支持测试参数和环境参数的设置和获取
- **事件总线**：统一的事件发布和订阅机制

### 测试上下文
- **集成工具**：HTTP客户端、Web应用、日志记录等
- **自定义应用**：支持自定义Web应用实例
- **参数访问**：便捷的参数和环境变量访问

## 安装

```bash
npm install @testring/api
```

## 主要组件

### 1. TestAPIController

测试API控制器，管理测试的执行状态和参数：

```typescript
import { testAPIController } from '@testring/api';

// 设置测试ID
testAPIController.setTestID('user-login-test');

// 设置测试参数
testAPIController.setTestParameters({
  username: 'testuser',
  password: 'testpass',
  timeout: 5000
});

// 设置环境参数
testAPIController.setEnvironmentParameters({
  baseUrl: 'https://api.example.com',
  apiKey: 'secret-key'
});

// 获取当前测试ID
const testId = testAPIController.getTestID();

// 获取测试参数
const params = testAPIController.getTestParameters();

// 获取环境参数
const env = testAPIController.getEnvironmentParameters();
```

### 2. BusEmitter

事件总线，处理测试事件的发布和订阅：

```typescript
import { testAPIController } from '@testring/api';

const bus = testAPIController.getBus();

// 监听测试事件
bus.on('started', () => {
  console.log('测试开始执行');
});

bus.on('finished', () => {
  console.log('测试执行完成');
});

bus.on('failed', (error: Error) => {
  console.error('测试执行失败:', error.message);
});

// 手动触发事件
await bus.startedTest();
await bus.finishedTest();
await bus.failedTest(new Error('测试失败'));
```

### 3. run 函数

测试运行的主要入口点：

```typescript
import { run, beforeRun, afterRun } from '@testring/api';

// 注册生命周期回调
beforeRun(() => {
  console.log('准备执行测试');
});

afterRun(() => {
  console.log('测试执行完毕');
});

// 定义测试函数
const loginTest = async (api) => {
  await api.log('开始登录测试');
  
  // 使用HTTP客户端
  const response = await api.http.post('/login', {
    username: 'testuser',
    password: 'testpass'
  });
  
  await api.log('登录请求完成', response.status);
  
  // 使用Web应用
  await api.application.url('https://example.com/dashboard');
  const title = await api.application.getTitle();
  
  await api.log('页面标题:', title);
};

// 执行测试
await run(loginTest);
```

### 4. TestContext

测试上下文类，提供测试环境和工具：

```typescript
// 在测试函数中使用
const myTest = async (api) => {
  // HTTP客户端
  const response = await api.http.get('/api/users');
  
  // Web应用操作
  await api.application.url('https://example.com');
  const element = await api.application.findElement('#login-button');
  await element.click();
  
  // 日志记录
  await api.log('用户操作完成');
  await api.logWarning('这是一个警告');
  await api.logError('这是一个错误');
  
  // 业务日志
  await api.logBusiness('用户登录流程');
  // ... 执行业务逻辑
  await api.stopLogBusiness();
  
  // 获取参数
  const params = api.getParameters();
  const env = api.getEnvironment();
  
  // 自定义应用
  const customApp = api.initCustomApplication(MyCustomWebApp);
  await customApp.doSomething();
};
```

## 完整使用示例

### 基本测试示例

```typescript
import { run, testAPIController, beforeRun, afterRun } from '@testring/api';

// 设置测试配置
testAPIController.setTestID('e2e-user-workflow');
testAPIController.setTestParameters({
  username: 'testuser@example.com',
  password: 'securepass123',
  timeout: 10000
});

testAPIController.setEnvironmentParameters({
  baseUrl: 'https://staging.example.com',
  apiKey: 'staging-api-key'
});

// 注册生命周期回调
beforeRun(async () => {
  console.log('测试准备阶段');
  // 初始化测试数据
  await setupTestData();
});

afterRun(async () => {
  console.log('测试清理阶段');
  // 清理测试数据
  await cleanupTestData();
});

// 定义测试函数
const userRegistrationTest = async (api) => {
  await api.logBusiness('用户注册流程测试');
  
  try {
    // 步骤1：访问注册页面
    await api.application.url(`${api.getEnvironment().baseUrl}/register`);
    await api.log('已访问注册页面');
    
    // 步骤2：填写注册表单
    const params = api.getParameters();
    await api.application.setValue('#email', params.username);
    await api.application.setValue('#password', params.password);
    await api.application.click('#register-btn');
    
    // 步骤3：验证注册成功
    const successMessage = await api.application.getText('.success-message');
    await api.log('注册成功消息:', successMessage);
    
    // 步骤4：API验证
    const response = await api.http.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${api.getEnvironment().apiKey}`
      }
    });
    
    await api.log('用户资料获取成功', response.data);
    
  } catch (error) {
    await api.logError('测试执行失败:', error);
    throw error;
  } finally {
    await api.stopLogBusiness();
  }
};

// 执行测试
await run(userRegistrationTest);
```

### 多测试函数示例

```typescript
import { run } from '@testring/api';

const loginTest = async (api) => {
  await api.logBusiness('用户登录测试');
  
  await api.application.url('/login');
  await api.application.setValue('#username', 'testuser');
  await api.application.setValue('#password', 'testpass');
  await api.application.click('#login-btn');
  
  const dashboard = await api.application.findElement('.dashboard');
  await api.log('登录成功，进入仪表板');
  
  await api.stopLogBusiness();
};

const profileTest = async (api) => {
  await api.logBusiness('用户资料测试');
  
  await api.application.click('#profile-link');
  const profileData = await api.application.getText('.profile-info');
  await api.log('用户资料:', profileData);
  
  await api.stopLogBusiness();
};

const logoutTest = async (api) => {
  await api.logBusiness('用户登出测试');
  
  await api.application.click('#logout-btn');
  const loginForm = await api.application.findElement('#login-form');
  await api.log('登出成功，返回登录页');
  
  await api.stopLogBusiness();
};

// 按顺序执行多个测试
await run(loginTest, profileTest, logoutTest);
```

### 自定义应用示例

```typescript
import { WebApplication } from '@testring/web-application';

class CustomWebApp extends WebApplication {
  async loginWithCredentials(username: string, password: string) {
    await this.url('/login');
    await this.setValue('#username', username);
    await this.setValue('#password', password);
    await this.click('#login-btn');
    
    // 等待登录完成
    await this.waitForElement('.dashboard', 5000);
  }
  
  async getUnreadNotifications() {
    const notifications = await this.findElements('.notification.unread');
    return notifications.length;
  }
}

const customAppTest = async (api) => {
  const customApp = api.initCustomApplication(CustomWebApp);
  
  await customApp.loginWithCredentials('testuser', 'testpass');
  const unreadCount = await customApp.getUnreadNotifications();
  
  await api.log(`未读通知数量: ${unreadCount}`);
  
  // 访问自定义应用列表
  const customApps = api.getCustomApplicationsList();
  await api.log(`自定义应用数量: ${customApps.length}`);
};
```

## 错误处理

```typescript
import { run, testAPIController } from '@testring/api';

// 监听测试失败事件
const bus = testAPIController.getBus();
bus.on('failed', (error: Error) => {
  console.error('测试失败详情:', {
    testId: testAPIController.getTestID(),
    error: error.message,
    stack: error.stack
  });
});

const errorHandlingTest = async (api) => {
  try {
    await api.logBusiness('错误处理测试');
    
    // 可能失败的操作
    await api.application.url('/invalid-url');
    
  } catch (error) {
    await api.logError('捕获到错误:', error);
    
    // 可以选择重新抛出或处理错误
    throw error;
  } finally {
    await api.stopLogBusiness();
  }
};

await run(errorHandlingTest);
```

## 性能优化

### HTTP请求优化
```typescript
const optimizedHttpTest = async (api) => {
  // 配置HTTP客户端
  const httpOptions = {
    timeout: 5000,
    retries: 3,
    headers: {
      'User-Agent': 'testring-test-client'
    }
  };
  
  // 并发请求
  const [user, posts, comments] = await Promise.all([
    api.http.get('/api/user', httpOptions),
    api.http.get('/api/posts', httpOptions),
    api.http.get('/api/comments', httpOptions)
  ]);
  
  await api.log('并发请求完成');
};
```

### 资源清理
```typescript
afterRun(async () => {
  // 确保所有资源被正确清理
  await api.end();
});
```

## 配置选项

### TestAPIController配置
```typescript
interface TestAPIControllerOptions {
  testID: string;                    // 测试ID
  testParameters: object;            // 测试参数
  environmentParameters: object;     // 环境参数
}
```

### TestContext配置
```typescript
interface TestContextConfig {
  httpThrottle?: number;             // HTTP请求限流
  runData?: ITestQueuedTestRunData;  // 运行数据
}
```

## 事件类型

```typescript
enum TestEvents {
  started = 'started',               // 测试开始
  finished = 'finished',             // 测试完成
  failed = 'failed'                  // 测试失败
}
```

## 依赖

- `@testring/web-application` - Web应用测试功能
- `@testring/async-breakpoints` - 异步断点支持
- `@testring/logger` - 日志记录系统
- `@testring/http-api` - HTTP客户端
- `@testring/transport` - 传输层
- `@testring/utils` - 工具函数
- `@testring/types` - 类型定义

## 相关模块

- `@testring/test-run-controller` - 测试运行控制器
- `@testring/test-worker` - 测试工作进程
- `@testring/cli` - 命令行界面
- `@testring/async-assert` - 异步断言库

## 最佳实践

1. **合理设置测试ID**：使用有意义的测试ID，便于日志追踪
2. **参数管理**：将可变参数和环境变量分离管理
3. **生命周期回调**：合理使用beforeRun和afterRun进行初始化和清理
4. **错误处理**：监听测试事件，实现完整的错误处理机制
5. **资源清理**：确保测试结束时正确清理所有资源