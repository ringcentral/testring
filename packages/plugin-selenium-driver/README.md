# @testring/plugin-selenium-driver

Selenium WebDriver 插件，为 testring 框架提供浏览器自动化测试功能。

## 功能概述

该插件集成了 Selenium WebDriver，提供了：
- 多浏览器支持（Chrome、Firefox、Safari、Edge）
- 自动化浏览器操作
- 元素定位和交互
- 页面导航和操作
- 截图和调试功能

## 主要特性

### 浏览器支持
- **Chrome** - 最常用的测试浏览器
- **Firefox** - 跨平台支持
- **Safari** - macOS 原生浏览器
- **Edge** - Windows 现代浏览器
- **Headless 模式** - 无界面运行

### 元素操作
- 元素查找和定位
- 点击、输入、选择操作
- 鼠标和键盘事件
- 拖拽和触摸操作

### 页面管理
- 页面导航和跳转
- 窗口和标签页管理
- 框架和弹窗处理
- 等待和同步机制

## 安装

```bash
npm install @testring/plugin-selenium-driver
```

### 额外依赖
需要安装对应的 WebDriver：

```bash
# Chrome
npm install chromedriver

# Firefox
npm install geckodriver

# Safari (macOS)
# 需要在系统中启用 Safari 开发者选项

# Edge
npm install edgedriver
```

## 配置

### 基本配置
```json
{
  "plugins": [
    ["@testring/plugin-selenium-driver", {
      "browser": "chrome",
      "headless": true,
      "windowSize": "1920x1080"
    }]
  ]
}
```

### 完整配置选项
```json
{
  "plugins": [
    ["@testring/plugin-selenium-driver", {
      "browser": "chrome",
      "headless": false,
      "windowSize": "1920x1080",
      "seleniumHub": "http://localhost:4444/wd/hub",
      "capabilities": {
        "browserName": "chrome",
        "browserVersion": "latest",
        "platformName": "linux"
      },
      "chromeOptions": {
        "args": ["--disable-web-security", "--allow-running-insecure-content"]
      },
      "firefoxOptions": {
        "prefs": {
          "network.http.phishy-userpass-length": 255
        }
      }
    }]
  ]
}
```

## 使用方法

### 基本用法
```javascript
// 测试文件
describe('登录测试', () => {
  it('应该能够成功登录', async () => {
    // 导航到登录页面
    await browser.url('https://example.com/login');
    
    // 输入用户名和密码
    await browser.setValue('#username', 'testuser');
    await browser.setValue('#password', 'testpass');
    
    // 点击登录按钮
    await browser.click('#login-button');
    
    // 验证登录成功
    const welcomeText = await browser.getText('#welcome');
    expect(welcomeText).toContain('欢迎');
  });
});
```

### 元素定位
```javascript
// 多种定位方式
await browser.click('#button-id');                    // ID
await browser.click('.button-class');                 // Class
await browser.click('button[type="submit"]');         // CSS 选择器
await browser.click('//button[@type="submit"]');      // XPath
await browser.click('=Submit');                       // 文本内容
await browser.click('*=Submit');                      // 部分文本
```

### 页面操作
```javascript
// 页面导航
await browser.url('https://example.com');
await browser.back();
await browser.forward();
await browser.refresh();

// 窗口操作
await browser.newWindow('https://example.com');
await browser.switchWindow('window-name');
await browser.closeWindow();

// 框架操作
await browser.switchToFrame('#frame-id');
await browser.switchToParentFrame();
```

### 等待机制
```javascript
// 等待元素出现
await browser.waitForVisible('#element', 5000);

// 等待元素消失
await browser.waitForHidden('#loading', 10000);

// 等待文本内容
await browser.waitForText('#status', 'Complete', 5000);

// 等待值变化
await browser.waitForValue('#input', 'expected-value', 3000);

// 自定义等待条件
await browser.waitUntil(() => {
  return browser.isVisible('#submit-button');
}, 5000, '提交按钮未出现');
```

### 表单操作
```javascript
// 输入框操作
await browser.setValue('#input', 'test value');
await browser.addValue('#input', ' additional');
await browser.clearValue('#input');

// 选择框操作
await browser.selectByVisibleText('#select', 'Option 1');
await browser.selectByValue('#select', 'option1');
await browser.selectByIndex('#select', 0);

// 复选框和单选框
await browser.click('#checkbox');
await browser.click('#radio');

// 文件上传
await browser.chooseFile('#file-input', './test-file.txt');
```

### 断言和验证
```javascript
// 元素存在性
const isVisible = await browser.isVisible('#element');
expect(isVisible).toBe(true);

// 文本内容
const text = await browser.getText('#element');
expect(text).toBe('Expected Text');

// 属性值
const value = await browser.getValue('#input');
expect(value).toBe('expected-value');

// 元素属性
const className = await browser.getAttribute('#element', 'class');
expect(className).toContain('active');
```

## 高级功能

### 多浏览器测试
```javascript
// 配置多个浏览器
const browsers = ['chrome', 'firefox', 'safari'];

browsers.forEach(browserName => {
  describe(`${browserName} 测试`, () => {
    beforeEach(async () => {
      await browser.switchBrowser(browserName);
    });
    
    it('应该在所有浏览器中正常工作', async () => {
      await browser.url('https://example.com');
      // 测试逻辑
    });
  });
});
```

### 截图功能
```javascript
// 全屏截图
await browser.saveScreenshot('./screenshots/full-page.png');

// 元素截图
await browser.saveElementScreenshot('#element', './screenshots/element.png');

// 失败时自动截图
afterEach(async function() {
  if (this.currentTest.state === 'failed') {
    await browser.saveScreenshot(`./screenshots/failed-${this.currentTest.title}.png`);
  }
});
```

### 性能监控
```javascript
// 页面加载时间
const startTime = Date.now();
await browser.url('https://example.com');
const loadTime = Date.now() - startTime;
console.log(`页面加载时间: ${loadTime}ms`);

// 网络请求监控
await browser.setupNetworkCapture();
await browser.url('https://example.com');
const networkLogs = await browser.getNetworkLogs();
```

## 调试功能

### 调试模式
```javascript
// 启用调试模式
await browser.debug();

// 暂停执行
await browser.pause(3000);

// 控制台日志
const logs = await browser.getLogs('browser');
console.log('浏览器日志:', logs);
```

### 元素检查
```javascript
// 获取元素信息
const element = await browser.$('#element');
const location = await element.getLocation();
const size = await element.getSize();
const tagName = await element.getTagName();

console.log('元素位置:', location);
console.log('元素大小:', size);
console.log('元素标签:', tagName);
```

## Selenium Grid 支持

### 配置 Selenium Grid
```json
{
  "plugins": [
    ["@testring/plugin-selenium-driver", {
      "seleniumHub": "http://selenium-hub:4444/wd/hub",
      "capabilities": {
        "browserName": "chrome",
        "browserVersion": "latest",
        "platformName": "linux"
      }
    }]
  ]
}
```

### Docker 支持
```yaml
# docker-compose.yml
version: '3'
services:
  selenium-hub:
    image: selenium/hub:latest
    ports:
      - "4444:4444"
  
  chrome:
    image: selenium/node-chrome:latest
    depends_on:
      - selenium-hub
    environment:
      - HUB_HOST=selenium-hub
```

## 故障排除

### 常见问题
1. **浏览器驱动不匹配**
   - 确保 ChromeDriver 版本与 Chrome 版本匹配
   - 使用 `chromedriver --version` 检查版本

2. **元素定位失败**
   - 使用 `browser.debug()` 调试
   - 检查元素是否在框架中
   - 等待元素加载完成

3. **超时问题**
   - 增加等待时间
   - 使用显式等待而非隐式等待
   - 检查网络连接

### 性能优化
```javascript
// 优化配置
{
  "chromeOptions": {
    "args": [
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-extensions"
    ]
  }
}
```

## 依赖

- `selenium-webdriver` - Selenium WebDriver 核心库
- `@testring/plugin-api` - 插件 API
- `@testring/types` - 类型定义

## 相关模块

- `@testring/plugin-playwright-driver` - 现代浏览器驱动
- `@testring/browser-proxy` - 浏览器代理
- `@testring/element-path` - 元素定位
- `@testring/web-application` - Web 应用测试