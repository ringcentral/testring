# 工具脚本目录

`utils/` 目录包含了 testring 项目的构建和维护工具脚本，主要用于项目的自动化管理和开发流程支持。

## 目录结构

### 构建工具脚本
- **`add-package-files.js`** - 添加包文件脚本，自动为包添加必要的文件
- **`check-packages-versions.js`** - 检查包版本脚本，验证包版本的一致性
- **`cleanup.js`** - 清理脚本，清理构建产物和临时文件
- **`generate-readme.js`** - 生成 README 脚本，自动生成包的 README 文件
- **`publish.js`** - 发布脚本，用于包的发布流程

### 模板文件
- **`templates/`** - 模板目录，包含项目模板文件
  - **`tsconfig.json`** - TypeScript 配置模板

## 脚本功能

### 包管理工具
- **`add-package-files.js`** - 为每个包添加标准的项目文件（如 .gitignore、.eslintrc 等）
- **`check-packages-versions.js`** - 检查所有包的版本号是否符合 lerna 管理规范
- **`generate-readme.js`** - 根据模板自动生成各个包的 README.md 文件

### 构建和发布工具
- **`cleanup.js`** - 清理所有包的构建产物，包括 dist 目录、node_modules 等
- **`publish.js`** - 自动化发布流程，支持批量发布和版本管理

## 使用方法

这些工具脚本主要通过 npm scripts 调用，在项目根目录的 package.json 中定义了相应的命令：

```bash
# 清理项目
npm run cleanup

# 添加包文件
npm run add-package-files

# 生成 README 文件
npm run generate-readme

# 检查依赖版本
npm run check-deps:validate

# 发布项目
npm run publish:ci
```

## 脚本特点

1. **自动化管理** - 支持批量操作多个包
2. **版本控制** - 严格的版本管理和检查
3. **模板化** - 使用模板确保项目结构的一致性
4. **CI/CD 支持** - 支持持续集成和持续部署流程

## 开发说明

### 添加新脚本
如果需要添加新的工具脚本，请遵循以下规范：
1. 使用 JavaScript 编写
2. 支持命令行参数
3. 包含错误处理和日志输出
4. 在 package.json 中添加相应的 npm script

### 模板管理
模板文件位于 `templates/` 目录下，用于生成新包时的标准化配置。修改模板时请确保向后兼容性。

## 维护说明

这些工具脚本是项目维护的重要组成部分，定期更新以支持新的功能和改进开发流程。修改时请注意：
1. 测试脚本的兼容性
2. 更新相关的文档
3. 考虑对现有包的影响 