# @testring/web-application

Web application testing module that serves as the core browser operation layer for the testring framework, providing comprehensive web application automation testing capabilities. This module encapsulates rich browser operation methods, element location, assertion mechanisms, and debugging features, making it the essential component for end-to-end web testing.

[![npm version](https://badge.fury.io/js/@testring/web-application.svg)](https://www.npmjs.com/package/@testring/web-application)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The web application testing module is the browser operation core of the testring framework, providing:

- **Complete browser element operations and interactions** with comprehensive DOM manipulation
- **Advanced waiting mechanisms and synchronization strategies** for reliable test execution
- **Built-in assertion system with soft assertion support** for flexible test validation
- **Intelligent element location and path management** using the element-path system
- **Screenshot and debugging tools integration** for test analysis and troubleshooting
- **Multi-window and tab management** for complex application testing
- **Cookie and session management** for authentication and state handling
- **File upload and download support** for comprehensive application testing

## Key Features

### 🎯 Element Operations
- Click, double-click, drag-and-drop, and other interaction operations
- Text input, selection, and clearing with smart handling
- Form element processing (input fields, dropdowns, checkboxes)
- Scrolling and focus management for viewport control
- Element attribute and style retrieval for validation

### ⏱️ Waiting Mechanisms
- Intelligent waiting for element existence, visibility, and clickability
- Conditional waiting with custom logic and predicates
- Timeout control and retry mechanisms for robust testing
- Page load waiting and document ready state detection

### ✅ Assertion System
- Built-in synchronous and asynchronous assertions
- Soft assertion support that doesn't interrupt test execution
- Automatic screenshot capture on assertion success and failure
- Rich assertion methods with custom error messages

### 🔧 Debugging Support
- Element highlighting and location visualization
- Debug breakpoints and step-by-step logging
- Developer tools integration and extension support
- Detailed operation logs and error tracking

## Installation

```bash
# Using npm
npm install @testring/web-application

# Using yarn
yarn add @testring/web-application

# Using pnpm
pnpm add @testring/web-application
```

## Core Architecture

### WebApplication Class

The main web application testing interface, extending `PluggableModule`:

```typescript
class WebApplication extends PluggableModule {
  constructor(
    testUID: string,
    transport: ITransport,
    config: Partial<IWebApplicationConfig>
  )

  // Assertion System
  public assert: AsyncAssertion
  public softAssert: AsyncAssertion

  // Element Path Management
  public root: ElementPathProxy

  // Client and Logging
  public get client(): WebClient
  public get logger(): LoggerClient

  // Core Methods
  public async openPage(url: string): Promise<void>
  public async click(element: ElementPath): Promise<void>
  public async setValue(element: ElementPath, value: string): Promise<void>
  public async getText(element: ElementPath): Promise<string>
  public async waitForExist(element: ElementPath, timeout?: number): Promise<void>
  public async makeScreenshot(force?: boolean): Promise<string>
}
```

### Configuration Options

```typescript
interface IWebApplicationConfig {
  screenshotsEnabled: boolean;      // Enable screenshot capture
  screenshotPath: string;           // Screenshot save path
  devtool: IDevtoolConfig | null;   // Developer tools configuration
  seleniumConfig?: any;             // Selenium configuration
}

interface IDevtoolConfig {
  extensionId: string;              // Browser extension ID
  httpPort: number;                 // HTTP server port
  wsPort: number;                   // WebSocket server port
  host: string;                     // Server host
}
```

## Basic Usage

### Creating a Web Application Instance

```typescript
import { WebApplication } from '@testring/web-application';
import { transport } from '@testring/transport';

// Create a web application test instance
const webApp = new WebApplication(
  'test-001',  // Unique test identifier
  transport,   // Transport layer instance
  {
    screenshotsEnabled: true,
    screenshotPath: './screenshots/',
    devtool: null
  }
);

// Wait for initialization to complete
await webApp.initPromise;
```

### Page Navigation and Basic Operations

```typescript
// Open a page
await webApp.openPage('https://example.com');

// Get page title
const title = await webApp.getTitle();
console.log('Page title:', title);

// Refresh the page
await webApp.refresh();

// Get page source
const source = await webApp.getSource();

// Execute JavaScript
const result = await webApp.execute(() => {
  return document.readyState;
});

// Navigate back and forward
await webApp.back();
await webApp.forward();

// Get current URL
const currentUrl = await webApp.getUrl();
console.log('Current URL:', currentUrl);
```

### Element Location and Interaction

```typescript
// Using element paths
const loginButton = webApp.root.button.contains('Login');
const usernameInput = webApp.root.input.id('username');
const passwordInput = webApp.root.input.type('password');

// Wait for element to exist
await webApp.waitForExist(loginButton);

// Wait for element to be visible
await webApp.waitForVisible(usernameInput);

// Click an element
await webApp.click(loginButton);

// Input text
await webApp.setValue(usernameInput, 'testuser@example.com');
await webApp.setValue(passwordInput, 'password123');

// Clear input
await webApp.clearValue(usernameInput);

// Get element text
const buttonText = await webApp.getText(loginButton);
console.log('Button text:', buttonText);

// Check if element exists
const exists = await webApp.isElementsExist(webApp.root.div.className('error-message'));
console.log('Error message exists:', exists);

// Check if element is visible
const visible = await webApp.isVisible(webApp.root.div.className('success-message'));
console.log('Success message visible:', visible);
```

### Using Assertions

```typescript
// Hard assertions (test stops on failure)
await webApp.assert.equal(
  await webApp.getTitle(),
  'Example Domain',
  'Page title should match expected value'
);

await webApp.assert.isTrue(
  await webApp.isVisible(webApp.root.h1),
  'Heading should be visible'
);

// Soft assertions (test continues on failure)
await webApp.softAssert.contains(
  await webApp.getText(webApp.root.p),
  'for illustrative examples',
  'Paragraph should contain expected text'
);

// Get soft assertion errors at the end of the test
const softErrors = webApp.getSoftAssertionErrors();
if (softErrors.length > 0) {
  console.log('Soft assertion failures:', softErrors);
}
```

## 高级元素操作

### 复杂交互操作

```typescript
// 双击元素
await webApp.doubleClick(webApp.root.div.className('editable'));

// 拖拽操作
const sourceElement = webApp.root.div.id('source');
const targetElement = webApp.root.div.id('target');
await webApp.dragAndDrop(sourceElement, targetElement);

// 坐标点击
await webApp.clickCoordinates(webApp.root.canvas, {
  x: 'center',
  y: 'center'
});

// 移动到元素
await webApp.moveToObject(webApp.root.button.text('提交'), 10, 10);

// 滚动到元素
await webApp.scrollIntoView(webApp.root.footer);
```

### 表单操作

```typescript
// 下拉框操作
const selectElement = webApp.root.select.name('country');

// 按值选择
await webApp.selectByValue(selectElement, 'CN');

// 按可见文本选择
await webApp.selectByVisibleText(selectElement, '中国');

// 按索引选择
await webApp.selectByIndex(selectElement, 0);

// 获取选中的文本
const selectedText = await webApp.getSelectedText(selectElement);

// 获取所有选项
const allOptions = await webApp.getSelectTexts(selectElement);
console.log('所有选项:', allOptions);

// 复选框操作
const checkbox = webApp.root.input.type('checkbox').name('agreement');
await webApp.setChecked(checkbox, true);

// 检查是否选中
const isChecked = await webApp.isChecked(checkbox);
console.log('复选框状态:', isChecked);
```

### 文件上传

```typescript
// 文件上传
const fileInput = webApp.root.input.type('file');
await webApp.uploadFile('/path/to/local/file.pdf');

// 等待上传完成
await webApp.waitForVisible(webApp.root.div.className('upload-success'));
```

## 等待和同步机制

### 基础等待方法

```typescript
// 等待元素存在
await webApp.waitForExist(
  webApp.root.div.className('loading'),
  10000  // 超时时间
);

// 等待元素可见
await webApp.waitForVisible(
  webApp.root.modal.className('dialog'),
  5000
);

// 等待元素不可见
await webApp.waitForNotVisible(
  webApp.root.div.className('spinner'),
  15000
);

// 等待元素不存在
await webApp.waitForNotExists(
  webApp.root.div.className('error-message'),
  3000
);
```

### 高级等待条件

```typescript
// 等待元素可点击
await webApp.waitForClickable(
  webApp.root.button.text('提交'),
  8000
);

// 等待元素启用
await webApp.waitForEnabled(
  webApp.root.input.name('email'),
  5000
);

// 等待元素稳定（位置不变）
await webApp.waitForStable(
  webApp.root.div.className('animated'),
  10000
);

// 自定义条件等待
await webApp.waitUntil(
  async () => {
    const count = await webApp.getElementsCount(webApp.root.li.className('item'));
    return count >= 5;
  },
  10000,
  '等待列表项数量达到5个失败'
);
```

### 状态检查方法

```typescript
// 检查元素是否存在
const exists = await webApp.isElementsExist(webApp.root.button.text('删除'));

// 检查元素是否可见
const visible = await webApp.isVisible(webApp.root.modal);

// 检查元素是否启用
const enabled = await webApp.isEnabled(webApp.root.button.text('提交'));

// 检查元素是否只读
const readOnly = await webApp.isReadOnly(webApp.root.input.name('code'));

// 检查元素是否可点击
const clickable = await webApp.isClickable(webApp.root.a.href('#'));

// 检查元素是否聚焦
const focused = await webApp.isFocused(webApp.root.input.name('search'));
```

## 断言系统

### 基础断言

```typescript
// 同步断言（失败时立即停止测试）
await webApp.assert.isTrue(
  await webApp.isVisible(webApp.root.h1.text('欢迎')),
  '首页标题应该可见'
);

await webApp.assert.equal(
  await webApp.getText(webApp.root.span.className('username')),
  'testuser@example.com',
  '用户名显示正确'
);

// 软断言（失败时不停止测试，继续执行）
await webApp.softAssert.isTrue(
  await webApp.isEnabled(webApp.root.button.text('保存')),
  '保存按钮应该启用'
);

await webApp.softAssert.contains(
  await webApp.getText(webApp.root.div.className('message')),
  '操作成功',
  '成功消息应该包含正确文本'
);

// 获取软断言错误
const softErrors = webApp.getSoftAssertionErrors();
if (softErrors.length > 0) {
  console.log('软断言失败:', softErrors);
}
```

### 自定义断言消息

```typescript
// 带成功和失败消息的断言
await webApp.assert.isTrue(
  await webApp.isVisible(webApp.root.div.className('success')),
  '操作成功提示显示',
  '验证成功提示显示正常'
);

// 复杂断言逻辑
await webApp.assert.isFalse(
  await webApp.isVisible(webApp.root.div.className('error')),
  '不应该显示错误信息'
);

// 数值断言
const itemCount = await webApp.getElementsCount(webApp.root.li.className('product'));
await webApp.assert.greaterThan(itemCount, 0, '产品列表不为空');
```

## 多窗口和标签页管理

### 标签页操作

```typescript
// 获取所有标签页ID
const tabIds = await webApp.getTabIds();
console.log('标签页列表:', tabIds);

// 获取当前标签页ID
const currentTab = await webApp.getCurrentTabId();

// 获取主标签页ID
const mainTab = await webApp.getMainTabId();

// 切换到指定标签页
await webApp.switchTab(tabIds[1]);

// 打开新窗口
await webApp.newWindow(
  'https://example.com/help',
  'helpWindow',
  { width: 800, height: 600 }
);

// 关闭当前标签页
await webApp.closeCurrentTab();

// 关闭所有其他标签页
await webApp.closeAllOtherTabs();

// 切换到主标签页
await webApp.switchToMainSiblingTab();
```

### 窗口管理

```typescript
// 最大化窗口
await webApp.maximizeWindow();

// 获取窗口大小
const windowSize = await webApp.getWindowSize();
console.log('窗口尺寸:', windowSize);

// 获取窗口句柄
const handles = await webApp.windowHandles();

// 切换窗口
await webApp.window(handles[0]);
```

## 框架和弹窗处理

### 框架切换

```typescript
// 切换到指定框架
await webApp.switchToFrame('contentFrame');

// 切换到父框架
await webApp.switchToParentFrame();

// 在框架中操作元素
await webApp.setValue(
  webApp.root.input.name('message'),
  '在框架中输入文本'
);
```

### 弹窗处理

```typescript
// 等待弹窗出现
await webApp.waitForAlert(5000);

// 检查是否有弹窗
const hasAlert = await webApp.isAlertOpen();

// 获取弹窗文本
const alertText = await webApp.alertText();
console.log('弹窗内容:', alertText);

// 接受弹窗
await webApp.alertAccept();

// 取消弹窗
await webApp.alertDismiss();
```

## Cookie 和会话管理

### Cookie 操作

```typescript
// 设置 Cookie
await webApp.setCookie({
  name: 'sessionId',
  value: 'abc123def456',
  domain: '.example.com',
  path: '/',
  httpOnly: false,
  secure: true
});

// 获取 Cookie
const sessionCookie = await webApp.getCookie('sessionId');
console.log('会话Cookie:', sessionCookie);

// 删除 Cookie
await webApp.deleteCookie('sessionId');

// 设置时区
await webApp.setTimeZone('Asia/Shanghai');
```

## 元素信息获取

### 基础属性获取

```typescript
const element = webApp.root.div.className('product-info');

// 获取元素文本
const text = await webApp.getText(element);

// 获取元素属性
const id = await webApp.getAttribute(element, 'id');
const className = await webApp.getAttribute(element, 'class');

// 获取元素值
const value = await webApp.getValue(webApp.root.input.name('price'));

// 获取元素HTML
const html = await webApp.getHTML(element);

// 获取元素尺寸
const size = await webApp.getSize(element);
console.log('元素尺寸:', size);

// 获取元素位置
const location = await webApp.getLocation(element);
console.log('元素位置:', location);
```

### CSS 样式获取

```typescript
// 获取CSS属性
const color = await webApp.getCssProperty(element, 'color');
const fontSize = await webApp.getCssProperty(element, 'font-size');
const display = await webApp.getCssProperty(element, 'display');

console.log('元素样式:', { color, fontSize, display });

// 检查CSS类是否存在
const hasActiveClass = await webApp.isCSSClassExists(
  webApp.root.button.text('提交'),
  'active',
  'btn-primary'
);
```

### 元素集合操作

```typescript
// 获取元素数量
const count = await webApp.getElementsCount(webApp.root.li.className('item'));

// 获取多个元素的文本
const texts = await webApp.getTexts(webApp.root.span.className('label'));
console.log('所有标签文本:', texts);

// 获取元素列表
const elements = await webApp.elements(webApp.root.div.className('card'));
console.log('找到的元素数量:', elements.length);
```

## 键盘和鼠标操作

### 键盘操作

```typescript
// 发送键盘输入
await webApp.keys(['Control', 'a']);  // 全选
await webApp.keys(['Control', 'c']);  // 复制
await webApp.keys(['Control', 'v']);  // 粘贴

// 发送特殊键
await webApp.keys('Tab');
await webApp.keys('Enter');
await webApp.keys('Escape');

// 组合键操作
await webApp.keys(['Shift', 'Tab']);
await webApp.keys(['Control', 'Shift', 'I']);  // 开发者工具
```

### 高级输入操作

```typescript
// 添加文本到现有内容
await webApp.addValue(webApp.root.textarea.name('comment'), '\n追加的文本');

// JavaScript模拟输入
await webApp.simulateJSFieldChange(
  webApp.root.input.name('dynamic'),
  '通过JS设置的值'
);

// 清除字段
await webApp.simulateJSFieldClear(webApp.root.input.name('temp'));
```

## 截图和调试

### 截图功能

```typescript
// 手动截图
const screenshotPath = await webApp.makeScreenshot();
console.log('截图保存路径:', screenshotPath);

// 强制截图（忽略配置）
await webApp.makeScreenshot(true);

// 禁用截图
await webApp.disableScreenshots();

// 启用截图
await webApp.enableScreenshots();
```

### 调试工具

```typescript
// 启用调试模式的配置
const webAppWithDebug = new WebApplication('test-debug', transport, {
  screenshotsEnabled: true,
  screenshotPath: './debug-screenshots/',
  devtool: {
    extensionId: 'chrome-extension-id',
    httpPort: 3000,
    wsPort: 3001,
    host: 'localhost'
  }
});

// 元素高亮（在调试模式下自动工作）
await webAppWithDebug.waitForExist(webApp.root.button.text('调试'));
```

## 高级功能

### PDF 生成

```typescript
// 生成PDF文件
await webApp.savePDF({
  filepath: './reports/page.pdf',
  format: 'A4',
  printBackground: true,
  landscape: false,
  margin: {
    top: '1cm',
    bottom: '1cm',
    left: '1cm',
    right: '1cm'
  }
});
```

### 扩展实例

```typescript
// 扩展WebApplication实例
const extendedApp = webApp.extendInstance({
  // 自定义方法
  async loginUser(username: string, password: string) {
    await this.setValue(this.root.input.name('username'), username);
    await this.setValue(this.root.input.name('password'), password);
    await this.click(this.root.button.type('submit'));
    await this.waitForVisible(this.root.div.className('dashboard'));
  },
  
  // 自定义属性
  customTimeout: 15000
});

// 使用扩展方法
await extendedApp.loginUser('admin', 'password123');
```

### 条件检查方法

```typescript
// 检查元素是否变为可见
const becameVisible = await webApp.isBecomeVisible(
  webApp.root.div.className('notification'),
  3000
);

// 检查元素是否变为隐藏
const becameHidden = await webApp.isBecomeHidden(
  webApp.root.div.className('loading'),
  10000
);

console.log('通知显示状态:', becameVisible);
console.log('加载动画隐藏状态:', becameHidden);
```

## 错误处理和最佳实践

### 错误处理模式

```typescript
class WebAppTestCase {
  private webApp: WebApplication;
  
  constructor(webApp: WebApplication) {
    this.webApp = webApp;
  }
  
  async safeClick(element: ElementPath, timeout = 10000) {
    try {
      await this.webApp.waitForClickable(element, timeout);
      await this.webApp.click(element);
      return true;
    } catch (error) {
      console.error('点击失败:', error.message);
      await this.webApp.makeScreenshot(true);  // 错误时强制截图
      return false;
    }
  }
  
  async safeSetValue(element: ElementPath, value: string, timeout = 10000) {
    try {
      await this.webApp.waitForExist(element, timeout);
      await this.webApp.clearValue(element);
      await this.webApp.setValue(element, value);
      
      // 验证值是否设置成功
      const actualValue = await this.webApp.getValue(element);
      if (actualValue !== value) {
        throw new Error(`值设置失败: 期望 "${value}", 实际 "${actualValue}"`);
      }
      
      return true;
    } catch (error) {
      console.error('设置值失败:', error.message);
      await this.webApp.makeScreenshot(true);
      return false;
    }
  }
}
```

### 超时控制

```typescript
// 自定义超时时间的操作
await webApp.waitForExist(webApp.root.div.className('slow-loading'), 30000);

// 快速检查（短超时）
try {
  await webApp.waitForVisible(webApp.root.div.className('popup'), 1000);
  console.log('弹窗快速显示');
} catch (error) {
  console.log('弹窗未快速显示，继续其他操作');
}

// 分阶段等待
await webApp.waitForExist(webApp.root.button.text('加载更多'), 5000);
await webApp.click(webApp.root.button.text('加载更多'));
await webApp.waitForVisible(webApp.root.div.className('new-content'), 15000);
```

### 重试机制

```typescript
class RetryHelper {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (i < maxRetries) {
          console.log(`操作失败，${delay}ms后重试 (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}

// 使用重试机制
await RetryHelper.withRetry(async () => {
  await webApp.click(webApp.root.button.text('不稳定的按钮'));
  await webApp.waitForVisible(webApp.root.div.className('success'), 3000);
}, 3, 2000);
```

## 性能优化

### 批量操作

```typescript
// 批量检查元素状态
const elements = [
  webApp.root.button.text('保存'),
  webApp.root.button.text('取消'),
  webApp.root.button.text('删除')
];

const statuses = await Promise.all(
  elements.map(async (element) => ({
    element: element.toString(),
    visible: await webApp.isVisible(element),
    enabled: await webApp.isEnabled(element)
  }))
);

console.log('按钮状态:', statuses);
```

### 选择性截图

```typescript
// 只在重要步骤截图
await webApp.disableScreenshots();

// 执行常规操作
await webApp.setValue(webApp.root.input.name('search'), 'test');
await webApp.click(webApp.root.button.text('搜索'));

// 在关键验证点启用截图
await webApp.enableScreenshots();
await webApp.waitForVisible(webApp.root.div.className('results'));
await webApp.makeScreenshot();
```

### 智能等待

```typescript
// 组合等待条件
async function waitForPageReady(webApp: WebApplication) {
  // 等待页面基础元素
  await webApp.waitForExist(webApp.root, 10000);
  
  // 等待加载指示器消失
  try {
    await webApp.waitForNotVisible(webApp.root.div.className('loading'), 15000);
  } catch {
    // 如果没有加载指示器，忽略错误
  }
  
  // 等待主要内容可见
  await webApp.waitForVisible(webApp.root.main, 10000);
  
  // 确保页面稳定
  await webApp.pause(500);
}

await waitForPageReady(webApp);
```

## 测试模式和环境

### 会话管理

```typescript
// 检查会话状态
if (webApp.isStopped()) {
  console.log('会话已停止');
} else {
  // 执行测试操作
  await webApp.openPage('https://example.com');
}

// 结束会话
await webApp.end();
```

### 配置驱动测试

```typescript
// 根据环境配置创建实例
function createWebApp(environment: string) {
  const configs = {
    development: {
      screenshotsEnabled: true,
      screenshotPath: './dev-screenshots/',
      devtool: { /* 开发工具配置 */ }
    },
    staging: {
      screenshotsEnabled: true,
      screenshotPath: './staging-screenshots/',
      devtool: null
    },
    production: {
      screenshotsEnabled: false,
      screenshotPath: './prod-screenshots/',
      devtool: null
    }
  };
  
  return new WebApplication(
    `test-${Date.now()}`,
    transport,
    configs[environment] || configs.development
  );
}

const webApp = createWebApp(process.env.NODE_ENV || 'development');
```

## API Reference

### Core Methods

#### Navigation
- `openPage(url: string): Promise<void>` - Navigate to a URL
- `refresh(): Promise<void>` - Refresh the current page
- `back(): Promise<void>` - Navigate back in browser history
- `forward(): Promise<void>` - Navigate forward in browser history
- `getTitle(): Promise<string>` - Get page title
- `getUrl(): Promise<string>` - Get current URL
- `getSource(): Promise<string>` - Get page source

#### Element Interaction
- `click(element: ElementPath): Promise<void>` - Click an element
- `doubleClick(element: ElementPath): Promise<void>` - Double-click an element
- `setValue(element: ElementPath, value: string): Promise<void>` - Set input value
- `clearValue(element: ElementPath): Promise<void>` - Clear input value
- `getText(element: ElementPath): Promise<string>` - Get element text
- `getAttribute(element: ElementPath, attribute: string): Promise<string>` - Get element attribute

#### Waiting Methods
- `waitForExist(element: ElementPath, timeout?: number): Promise<void>` - Wait for element to exist
- `waitForVisible(element: ElementPath, timeout?: number): Promise<void>` - Wait for element to be visible
- `waitForClickable(element: ElementPath, timeout?: number): Promise<void>` - Wait for element to be clickable
- `waitForEnabled(element: ElementPath, timeout?: number): Promise<void>` - Wait for element to be enabled
- `waitUntil(condition: () => Promise<boolean>, timeout?: number, message?: string): Promise<void>` - Wait for custom condition

#### State Checking
- `isElementsExist(element: ElementPath): Promise<boolean>` - Check if element exists
- `isVisible(element: ElementPath): Promise<boolean>` - Check if element is visible
- `isEnabled(element: ElementPath): Promise<boolean>` - Check if element is enabled
- `isClickable(element: ElementPath): Promise<boolean>` - Check if element is clickable
- `isFocused(element: ElementPath): Promise<boolean>` - Check if element is focused

#### Form Operations
- `selectByValue(element: ElementPath, value: string): Promise<void>` - Select option by value
- `selectByVisibleText(element: ElementPath, text: string): Promise<void>` - Select option by text
- `selectByIndex(element: ElementPath, index: number): Promise<void>` - Select option by index
- `setChecked(element: ElementPath, checked: boolean): Promise<void>` - Set checkbox state
- `isChecked(element: ElementPath): Promise<boolean>` - Check if checkbox is checked

#### Screenshots and Debugging
- `makeScreenshot(force?: boolean): Promise<string>` - Take a screenshot
- `enableScreenshots(): Promise<void>` - Enable screenshot capture
- `disableScreenshots(): Promise<void>` - Disable screenshot capture

### Assertion Methods

#### Hard Assertions (AsyncAssertion)
- `assert.equal(actual: any, expected: any, message?: string): Promise<void>`
- `assert.notEqual(actual: any, expected: any, message?: string): Promise<void>`
- `assert.isTrue(value: boolean, message?: string): Promise<void>`
- `assert.isFalse(value: boolean, message?: string): Promise<void>`
- `assert.contains(haystack: string, needle: string, message?: string): Promise<void>`
- `assert.greaterThan(actual: number, expected: number, message?: string): Promise<void>`

#### Soft Assertions
- `softAssert.*` - Same methods as hard assertions but don't stop test execution
- `getSoftAssertionErrors(): Array<Error>` - Get accumulated soft assertion errors

## Best Practices

### 1. Element Location Strategy
- **Use stable locators**: Prefer IDs and data attributes over CSS classes
- **Avoid brittle selectors**: Don't rely on changing text content or structure
- **Use semantic element paths**: Create readable and maintainable selectors
- **Implement Page Object Model**: Encapsulate element location in page objects

### 2. Waiting and Synchronization
- **Set appropriate timeouts**: Avoid too long or too short timeout values
- **Use explicit waits**: Prefer explicit waits over fixed delays
- **Combine wait conditions**: Ensure proper page state with multiple conditions
- **Add strategic waits**: Include appropriate waits before and after critical operations

### 3. Assertions and Verification
- **Use clear assertion messages**: Provide helpful messages for debugging
- **Use soft assertions wisely**: Avoid test interruption when appropriate
- **Capture screenshots on failure**: Automatically document assertion failures
- **Verify results, not just actions**: Check operation outcomes, not just execution

### 4. Error Handling
- **Implement comprehensive error handling**: Catch and handle all possible errors
- **Log detailed error information**: Include context and debugging information
- **Provide helpful error messages**: Give actionable error descriptions
- **Implement retry mechanisms**: Handle intermittent issues gracefully

### 5. Performance Optimization
- **Minimize unnecessary operations**: Avoid excessive screenshots and logging
- **Use batch operations**: Reduce network overhead with bulk operations
- **Optimize element location**: Use efficient selector strategies
- **Control concurrency**: Balance parallel execution with resource constraints

## Common Patterns

### Page Object Model

```typescript
class LoginPage {
  constructor(private webApp: WebApplication) {}

  // Element definitions
  get usernameInput() { return this.webApp.root.input.name('username'); }
  get passwordInput() { return this.webApp.root.input.name('password'); }
  get loginButton() { return this.webApp.root.button.type('submit'); }
  get errorMessage() { return this.webApp.root.div.className('error'); }

  // Page actions
  async login(username: string, password: string) {
    await this.webApp.setValue(this.usernameInput, username);
    await this.webApp.setValue(this.passwordInput, password);
    await this.webApp.click(this.loginButton);
  }

  async waitForError() {
    await this.webApp.waitForVisible(this.errorMessage, 5000);
  }

  async getErrorText() {
    return await this.webApp.getText(this.errorMessage);
  }
}
```

### Test Helper Class

```typescript
class TestHelper {
  constructor(private webApp: WebApplication) {}

  async safeClick(element: ElementPath, timeout = 10000) {
    try {
      await this.webApp.waitForClickable(element, timeout);
      await this.webApp.click(element);
      return true;
    } catch (error) {
      await this.webApp.makeScreenshot(true);
      console.error('Click failed:', error.message);
      return false;
    }
  }

  async waitForPageLoad() {
    await this.webApp.waitUntil(async () => {
      const readyState = await this.webApp.execute(() => document.readyState);
      return readyState === 'complete';
    }, 30000, 'Page failed to load');
  }

  async verifyElementText(element: ElementPath, expectedText: string) {
    await this.webApp.waitForVisible(element);
    const actualText = await this.webApp.getText(element);
    await this.webApp.assert.equal(actualText, expectedText,
      `Element text should be "${expectedText}" but was "${actualText}"`);
  }
}
```

## Troubleshooting

### Common Issues

#### Element Not Found
```bash
Error: Element not found
```
**Solutions:**
- Check element path syntax and selectors
- Increase wait timeout values
- Ensure page has fully loaded
- Verify element exists in DOM

#### Timeout Errors
```bash
Error: Timeout waiting for element
```
**Solutions:**
- Increase timeout values for slow operations
- Optimize wait conditions
- Check network connectivity and page performance
- Use more specific wait conditions

#### Element Not Clickable
```bash
Error: Element is not clickable
```
**Solutions:**
- Wait for element to become clickable
- Scroll element into view
- Check if element is covered by other elements
- Ensure element is enabled and visible

#### Assertion Failures
```bash
AssertionError: Expected true but got false
```
**Solutions:**
- Review assertion logic and expected values
- Check page state and timing
- Add debugging information and screenshots
- Use soft assertions for non-critical checks

### Debug Tips

```typescript
// Enable verbose logging
const webApp = new WebApplication('debug-test', transport, {
  screenshotsEnabled: true,
  screenshotPath: './debug/',
  devtool: {
    extensionId: 'debug-extension',
    httpPort: 3000,
    wsPort: 3001,
    host: 'localhost'
  }
});

// Debug element location
const element = webApp.root.button.text('Submit');
console.log('Element path:', element.toString());

// Check element state
console.log('Element exists:', await webApp.isElementsExist(element));
console.log('Element visible:', await webApp.isVisible(element));
console.log('Element enabled:', await webApp.isEnabled(element));

// Debug page state
console.log('Page title:', await webApp.getTitle());
console.log('Page URL:', await webApp.getUrl());
console.log('Page ready state:', await webApp.execute(() => document.readyState));
```

## Dependencies

- **`@testring/async-assert`** - Asynchronous assertion system
- **`@testring/element-path`** - Element path management
- **`@testring/fs-store`** - File storage for screenshots
- **`@testring/logger`** - Logging functionality
- **`@testring/transport`** - Transport layer communication
- **`@testring/utils`** - Utility functions

## Related Modules

- **`@testring/plugin-selenium-driver`** - Selenium WebDriver plugin
- **`@testring/plugin-playwright-driver`** - Playwright driver plugin
- **`@testring/browser-proxy`** - Browser proxy service
- **`@testring/devtool-extension`** - Developer tools extension

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.