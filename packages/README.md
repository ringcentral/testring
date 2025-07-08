# Packages 扩展包

`packages/` 目录包含了 testring 测试框架的扩展包和插件，提供了框架的额外功能和集成能力。这些包主要用于浏览器驱动、Web 应用测试、开发工具等功能扩展。

## 目录结构

### 浏览器驱动包
- **`plugin-selenium-driver/`** - Selenium WebDriver 插件，支持多种浏览器自动化
- **`plugin-playwright-driver/`** - Playwright 驱动插件，现代浏览器自动化解决方案
- **`browser-proxy/`** - 浏览器代理服务，提供浏览器与测试框架的通信桥梁

### Web 应用测试包
- **`web-application/`** - Web 应用测试包，提供 Web 应用的测试功能
- **`element-path/`** - 元素路径定位，提供 DOM 元素的精确定位功能
- **`e2e-test-app/`** - 端到端测试应用，包含完整的测试用例和示例

### 开发工具包
- **`devtool-frontend/`** - 开发工具前端，提供测试调试和监控界面
- **`devtool-backend/`** - 开发工具后端，提供开发工具的后端服务
- **`devtool-extension/`** - 开发工具扩展，浏览器扩展形式的开发工具

### 网络和通信包
- **`client-ws-transport/`** - WebSocket 传输客户端，支持 WebSocket 通信
- **`http-api/`** - HTTP API 包，提供 HTTP 接口支持

### 文件和存储包
- **`plugin-fs-store/`** - 文件系统存储插件，提供文件存储功能
- **`download-collector-crx/`** - 下载收集器 Chrome 扩展，收集浏览器下载文件

### 构建和工具包
- **`plugin-babel/`** - Babel 插件，支持 ES6+ 语法转换
- **`test-utils/`** - 测试工具包，提供测试相关的实用工具函数

## 主要特性

1. **浏览器支持** - 支持多种浏览器驱动（Selenium、Playwright）
2. **Web 应用测试** - 专门针对 Web 应用的测试功能
3. **开发工具** - 完整的开发和调试工具链
4. **网络通信** - 多种网络通信方式支持
5. **文件处理** - 文件上传、下载和存储功能
6. **现代化构建** - 支持现代 JavaScript 语法和构建工具

## 插件分类

### 驱动插件
- `plugin-selenium-driver` - 传统 Selenium 驱动
- `plugin-playwright-driver` - 现代 Playwright 驱动

### 功能插件
- `plugin-babel` - 代码转换插件
- `plugin-fs-store` - 文件存储插件

### 工具包
- `browser-proxy` - 浏览器代理
- `element-path` - 元素定位
- `test-utils` - 测试工具
- `http-api` - HTTP 接口

### 开发工具
- `devtool-frontend` - 前端界面
- `devtool-backend` - 后端服务
- `devtool-extension` - 浏览器扩展

### 应用和示例
- `web-application` - Web 应用测试
- `e2e-test-app` - E2E 测试示例

## 使用说明

这些包可以通过 npm 独立安装使用，也可以作为 testring 框架的插件使用。每个包都有独立的版本管理和发布周期。

### 安装示例
```bash
# 安装 Selenium 驱动插件
npm install @testring/plugin-selenium-driver

# 安装 Playwright 驱动插件
npm install @testring/plugin-playwright-driver

# 安装 Web 应用测试包
npm install @testring/web-application
```

### 插件配置示例
```json
{
  "plugins": [
    "@testring/plugin-selenium-driver",
    "@testring/plugin-playwright-driver",
    "@testring/plugin-babel"
  ]
}
```

## 开发和扩展

如果需要开发新的插件或扩展包，可以参考现有包的结构和实现方式。每个包都遵循统一的项目结构和开发规范。 