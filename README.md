# testring

[![license](https://img.shields.io/github/license/ringcentral/testring.svg)](https://github.com/ringcentral/testring/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/testring.svg)](https://www.npmjs.com/package/testring)
[![Node.js CI](https://github.com/ringcentral/testring/actions/workflows/node.js.yml/badge.svg)](https://github.com/ringcentral/testring/actions/workflows/node.js.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ringcentral_testring&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ringcentral_testring)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=ringcentral_testring&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=ringcentral_testring)

基于 Node.js 的简单、强大的自动化 UI 测试框架。

## 项目概述

testring 是一个现代化的测试框架，专门为 Web 应用的自动化测试而设计。它提供了：

- 🚀 **高性能** - 多进程并行执行测试
- 🔧 **可扩展** - 丰富的插件系统
- 🌐 **多浏览器** - 支持 Chrome、Firefox、Safari、Edge
- 📱 **现代化** - 支持 Selenium 和 Playwright 驱动
- 🛠️ **开发友好** - 完整的开发工具链

## 项目结构

```
testring/
├── core/              # 核心模块 - 框架的基础功能
│   ├── api/           # 测试 API 控制器
│   ├── cli/           # 命令行界面
│   ├── logger/        # 分布式日志系统
│   ├── transport/     # 进程间通信
│   ├── test-worker/   # 测试工作进程
│   └── ...           # 其他核心模块
├── packages/          # 扩展包 - 插件和工具
│   ├── plugin-selenium-driver/    # Selenium 驱动插件
│   ├── plugin-playwright-driver/  # Playwright 驱动插件
│   ├── web-application/           # Web 应用测试
│   ├── devtool-frontend/          # 开发工具前端
│   └── ...                       # 其他扩展包
├── docs/              # 文档目录
├── utils/             # 构建和维护工具
└── README.md          # 项目说明
```

### 核心模块 (core/)

核心模块提供了框架的基础功能：

- **API 层** - 测试运行和控制接口
- **CLI 工具** - 命令行界面和参数处理
- **进程管理** - 多进程测试执行和通信
- **文件系统** - 测试文件查找和读取
- **日志系统** - 分布式日志记录和管理
- **插件系统** - 可扩展的插件架构

### 扩展包 (packages/)

扩展包提供了额外的功能和工具：

- **浏览器驱动** - Selenium 和 Playwright 支持
- **Web 测试** - Web 应用专用测试功能
- **开发工具** - 调试和监控工具
- **网络通信** - WebSocket 和 HTTP 支持
- **文件处理** - 文件上传下载和存储

## 快速开始

### 安装

```bash
# 安装主框架
npm install testring

# 安装 Selenium 驱动（推荐）
npm install @testring/plugin-selenium-driver

# 或安装 Playwright 驱动
npm install @testring/plugin-playwright-driver
```

### 基本配置

创建 `.testringrc` 配置文件：

```json
{
  "tests": "./tests/**/*.spec.js",
  "plugins": [
    "@testring/plugin-selenium-driver"
  ],
  "workerLimit": 2,
  "retryCount": 3
}
```

### 编写测试

```javascript
// tests/example.spec.js
describe('示例测试', () => {
  it('应该能够访问首页', async () => {
    await browser.url('https://example.com');
    
    const title = await browser.getTitle();
    expect(title).toBe('Example Domain');
  });
});
```

### 运行测试

```bash
# 运行所有测试
testring run

# 运行特定测试
testring run --tests "./tests/login.spec.js"

# 设置并行数
testring run --workerLimit 4

# 调试模式
testring run --logLevel debug
```

## 文档

详细文档请参考：

- [API 参考](docs/api.md) - 框架 API 说明
- [配置参考](docs/config.md) - 完整配置选项
- [插件手册](docs/plugin-handbook.md) - 插件开发指南

## 主要特性

### 多进程并行执行
- 支持多个测试同时运行
- 进程间隔离，避免测试干扰
- 智能负载均衡

### 多浏览器支持
- Chrome、Firefox、Safari、Edge
- Headless 模式支持
- 移动端浏览器测试

### 插件系统
- 丰富的官方插件
- 简单的插件开发 API
- 社区插件支持

### 开发工具
- 可视化调试界面
- 实时测试监控
- 详细的测试报告

## 开发

### 项目设置
```bash
# 克隆项目
git clone https://github.com/ringcentral/testring.git

# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test
```

### 贡献

欢迎贡献代码！请参考：
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 支持

- 📖 [文档](docs/)
- 🐛 [问题反馈](https://github.com/ringcentral/testring/issues)
- 💬 [讨论](https://github.com/ringcentral/testring/discussions)
