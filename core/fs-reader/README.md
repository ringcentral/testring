# @testring/fs-reader

文件系统读取器模块，提供了测试文件的查找、读取和解析功能。

## 功能概述

该模块负责处理测试文件的文件系统操作，包括：
- 根据 glob 模式查找测试文件
- 读取和解析测试文件内容
- 支持插件化的文件处理
- 提供文件缓存和优化

## 主要组件

### FSReader
文件系统读取器主类：

```typescript
export class FSReader extends PluggableModule implements IFSReader {
  // 根据模式查找文件
  find(pattern: string): Promise<IFile[]>
  
  // 读取单个文件
  readFile(fileName: string): Promise<IFile | null>
}
```

### 文件接口
```typescript
interface IFile {
  path: string;           // 文件路径
  content: string;        // 文件内容
  dependencies?: string[]; // 依赖文件
}
```

## 主要功能

### 文件查找
使用 glob 模式查找测试文件：

```typescript
import { FSReader } from '@testring/fs-reader';

const fsReader = new FSReader();

// 查找所有测试文件
const files = await fsReader.find('./tests/**/*.spec.js');
console.log('找到的测试文件:', files.map(f => f.path));

// 支持复杂的 glob 模式
const unitTests = await fsReader.find('./src/**/*.{test,spec}.{js,ts}');
```

### 文件读取
读取单个文件的内容：

```typescript
import { FSReader } from '@testring/fs-reader';

const fsReader = new FSReader();

// 读取特定文件
const file = await fsReader.readFile('./tests/login.spec.js');
if (file) {
  console.log('文件路径:', file.path);
  console.log('文件内容:', file.content);
}
```

## 支持的文件格式

### JavaScript 文件
```javascript
// tests/example.spec.js
describe('示例测试', () => {
  it('应该通过测试', () => {
    expect(true).toBe(true);
  });
});
```

### TypeScript 文件
```typescript
// tests/example.spec.ts
describe('示例测试', () => {
  it('应该通过测试', () => {
    expect(true).toBe(true);
  });
});
```

### 模块化测试
```javascript
// tests/modular.spec.js
import { helper } from './helper';

describe('模块化测试', () => {
  it('使用辅助函数', () => {
    expect(helper.add(1, 2)).toBe(3);
  });
});
```

## 插件支持

FSReader 支持插件来扩展文件处理功能：

### 插件钩子
- `beforeResolve` - 文件解析前处理
- `afterResolve` - 文件解析后处理

### 自定义文件处理插件
```typescript
export default (pluginAPI) => {
  const fsReader = pluginAPI.getFSReader();
  
  if (fsReader) {
    // 文件解析前处理
    fsReader.beforeResolve((files) => {
      // 过滤掉某些文件
      return files.filter(file => !file.path.includes('skip'));
    });
    
    // 文件解析后处理
    fsReader.afterResolve((files) => {
      // 添加额外的文件信息
      return files.map(file => ({
        ...file,
        lastModified: fs.statSync(file.path).mtime
      }));
    });
  }
};
```

## Glob 模式支持

### 基本模式
```typescript
// 匹配所有 .js 文件
await fsReader.find('**/*.js');

// 匹配特定目录
await fsReader.find('./tests/**/*.spec.js');

// 匹配多种文件类型
await fsReader.find('**/*.{js,ts}');
```

### 高级模式
```typescript
// 排除某些文件
await fsReader.find('**/*.spec.js', { ignore: ['**/node_modules/**'] });

// 匹配特定命名模式
await fsReader.find('**/*.{test,spec}.{js,ts}');

// 深度限制
await fsReader.find('**/!(node_modules)/**/*.spec.js');
```

## 文件解析

### 依赖解析
自动解析文件依赖关系：

```typescript
// 主测试文件
import { helper } from './helper';
import { config } from '../config';

// FSReader 会自动识别依赖
const files = await fsReader.find('./tests/**/*.spec.js');
// 结果中包含依赖信息
// file.dependencies = ['./helper.js', '../config.js']
```

### 内容解析
解析文件内容并提取信息：

```typescript
const file = await fsReader.readFile('./tests/example.spec.js');
// file.content 包含完整的文件内容
// 可以进一步解析 AST 或提取测试用例信息
```

## 性能优化

### 文件缓存
- 自动缓存已读取的文件
- 监听文件变化，自动更新缓存
- 减少重复的文件系统访问

### 并行处理
- 并行读取多个文件
- 异步处理文件内容
- 优化大量文件的处理性能

### 内存管理
- 智能的内存使用
- 及时释放不需要的文件内容
- 支持大型项目的文件处理

## 错误处理

### 文件不存在
```typescript
try {
  const files = await fsReader.find('./nonexistent/**/*.js');
} catch (error) {
  console.error('没有找到匹配的文件:', error.message);
}
```

### 文件读取错误
```typescript
const file = await fsReader.readFile('./protected-file.js');
if (!file) {
  console.log('文件读取失败或文件不存在');
}
```

### 权限问题
```typescript
try {
  await fsReader.find('./protected-dir/**/*.js');
} catch (error) {
  if (error.code === 'EACCES') {
    console.error('没有权限访问文件');
  }
}
```

## 配置选项

### 查找选项
```typescript
interface FindOptions {
  ignore?: string[];      // 忽略的文件模式
  absolute?: boolean;     // 返回绝对路径
  maxDepth?: number;      // 最大搜索深度
}
```

### 读取选项
```typescript
interface ReadOptions {
  encoding?: string;      // 文件编码
  cache?: boolean;        // 是否使用缓存
}
```

## 使用示例

### 基本用法
```typescript
import { FSReader } from '@testring/fs-reader';

const fsReader = new FSReader();

// 查找所有测试文件
const testFiles = await fsReader.find('./tests/**/*.spec.js');

// 处理每个文件
for (const file of testFiles) {
  console.log(`处理文件: ${file.path}`);
  // 执行测试或其他处理
}
```

### 与其他模块集成
```typescript
import { FSReader } from '@testring/fs-reader';
import { TestRunner } from '@testring/test-runner';

const fsReader = new FSReader();
const testRunner = new TestRunner();

// 查找并执行测试
const files = await fsReader.find('./tests/**/*.spec.js');
for (const file of files) {
  await testRunner.execute(file);
}
```

## 安装

```bash
npm install @testring/fs-reader
```

## 依赖

- `@testring/pluggable-module` - 插件支持
- `@testring/logger` - 日志记录
- `@testring/types` - 类型定义
- `glob` - 文件模式匹配

## 相关模块

- `@testring/test-run-controller` - 测试运行控制器
- `@testring/dependencies-builder` - 依赖构建器
- `@testring/plugin-api` - 插件 API