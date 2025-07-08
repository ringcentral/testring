# @testring/async-assert

基于 Chai 的异步断言库，为 testring 框架提供完整的异步断言支持。

## 功能概述

该模块是 Chai 断言库的异步包装器，提供了：
- 将所有 Chai 断言方法转换为异步版本
- 支持软断言和硬断言模式
- 错误收集和自定义处理机制
- 完整的 TypeScript 类型支持

## 主要特性

### 异步断言支持
- 所有断言方法返回 Promise
- 适配异步测试环境
- 与多进程测试框架完美集成

### 软断言机制
- **硬断言**：失败时立即抛出错误（默认模式）
- **软断言**：失败时收集错误，继续执行后续断言

### 错误处理
- 自动收集断言失败信息
- 支持自定义成功/失败回调
- 提供详细的错误上下文

## 安装

```bash
npm install @testring/async-assert
```

## 基本用法

### 创建断言实例

```typescript
import { createAssertion } from '@testring/async-assert';

// 创建默认断言实例（硬断言模式）
const assert = createAssertion();

// 创建软断言实例
const softAssert = createAssertion({ isSoft: true });
```

### 异步断言示例

```typescript
// 基本断言
await assert.equal(actual, expected, '值应该相等');
await assert.isTrue(condition, '条件应该为真');
await assert.lengthOf(array, 3, '数组长度应该为3');

// 类型断言
await assert.isString(value, '值应该是字符串');
await assert.isNumber(count, '计数应该是数字');
await assert.isArray(list, '应该是数组');

// 包含断言
await assert.include(haystack, needle, '应该包含指定值');
await assert.property(object, 'prop', '对象应该有指定属性');

// 异常断言
await assert.throws(() => {
  throw new Error('测试错误');
}, '应该抛出错误');
```

## 软断言模式

软断言允许测试继续执行，即使某些断言失败：

```typescript
import { createAssertion } from '@testring/async-assert';

const assert = createAssertion({ isSoft: true });

// 执行多个断言
await assert.equal(user.name, 'John', '用户名检查');
await assert.equal(user.age, 25, '年龄检查');
await assert.isTrue(user.isActive, '激活状态检查');

// 获取所有错误信息
const errors = assert._errorMessages;
if (errors.length > 0) {
  console.log('发现以下断言失败:');
  errors.forEach(error => console.log('- ' + error));
}
```

## 自定义回调处理

```typescript
const assert = createAssertion({
  onSuccess: async (data) => {
    console.log(`✓ ${data.assertMessage}`);
    // 记录成功的断言
  },
  
  onError: async (data) => {
    console.log(`✗ ${data.assertMessage}`);
    console.log(`  错误: ${data.errorMessage}`);
    
    // 可以返回自定义错误对象
    return new Error(`自定义错误: ${data.errorMessage}`);
  }
});

await assert.equal(actual, expected);
```

## 支持的断言方法

### 相等性断言
```typescript
await assert.equal(actual, expected);          // 非严格相等 (==)
await assert.notEqual(actual, expected);       // 非严格不等 (!=)
await assert.strictEqual(actual, expected);    // 严格相等 (===)
await assert.notStrictEqual(actual, expected); // 严格不等 (!==)
await assert.deepEqual(actual, expected);      // 深度相等
await assert.notDeepEqual(actual, expected);   // 深度不等
```

### 真值断言
```typescript
await assert.ok(value);                        // 真值检查
await assert.notOk(value);                     // 假值检查
await assert.isTrue(value);                    // 严格 true
await assert.isFalse(value);                   // 严格 false
await assert.isNotTrue(value);                 // 非 true
await assert.isNotFalse(value);                // 非 false
```

### 类型断言
```typescript
await assert.isString(value);                  // 字符串类型
await assert.isNumber(value);                  // 数字类型
await assert.isBoolean(value);                 // 布尔类型
await assert.isArray(value);                   // 数组类型
await assert.isObject(value);                  // 对象类型
await assert.isFunction(value);                // 函数类型
await assert.typeOf(value, 'string');          // 类型检查
await assert.instanceOf(value, Array);         // 实例检查
```

### 空值断言
```typescript
await assert.isNull(value);                    // null 检查
await assert.isNotNull(value);                 // 非 null 检查
await assert.isUndefined(value);               // undefined 检查
await assert.isDefined(value);                 // 已定义检查
await assert.exists(value);                    // 存在检查
await assert.notExists(value);                 // 不存在检查
```

### 数值断言
```typescript
await assert.isAbove(valueToCheck, valueToBeAbove);      // 大于
await assert.isAtLeast(valueToCheck, valueToBeAtLeast);  // 大于等于
await assert.isBelow(valueToCheck, valueToBeBelow);      // 小于
await assert.isAtMost(valueToCheck, valueToBeAtMost);    // 小于等于
await assert.closeTo(actual, expected, delta);           // 近似相等
```

### 包含断言
```typescript
await assert.include(haystack, needle);        // 包含检查
await assert.notInclude(haystack, needle);     // 不包含检查
await assert.deepInclude(haystack, needle);    // 深度包含
await assert.property(object, 'prop');         // 属性存在
await assert.notProperty(object, 'prop');      // 属性不存在
await assert.propertyVal(object, 'prop', val); // 属性值检查
await assert.lengthOf(object, length);         // 长度检查
```

### 异常断言
```typescript
await assert.throws(() => {
  throw new Error('test');
});                                             // 抛出异常

await assert.doesNotThrow(() => {
  // 正常代码
});                                             // 不抛出异常
```

### 集合断言
```typescript
await assert.sameMembers(set1, set2);          // 相同成员
await assert.sameDeepMembers(set1, set2);      // 深度相同成员
await assert.includeMembers(superset, subset); // 包含成员
await assert.oneOf(value, list);               // 值在列表中
```

## 插件支持

支持 Chai 插件来扩展断言功能：

```typescript
import chaiAsPromised from 'chai-as-promised';

const assert = createAssertion({
  plugins: [chaiAsPromised]
});

// 现在可以使用插件提供的断言
await assert.eventually.equal(promise, expectedValue);
```

## 配置选项

```typescript
interface IAssertionOptions {
  isSoft?: boolean;                    // 是否使用软断言模式
  plugins?: Array<ChaiPlugin>;        // Chai 插件列表
  onSuccess?: (data: SuccessData) => Promise<void>;  // 成功回调
  onError?: (data: ErrorData) => Promise<Error | void>; // 错误回调
}
```

### 回调数据结构

```typescript
interface SuccessData {
  isSoft: boolean;                     // 是否软断言
  successMessage: string;              // 成功消息
  assertMessage: string;               // 断言消息
  args: any[];                         // 断言参数
  originalMethod: string;              // 原始方法名
}

interface ErrorData {
  isSoft: boolean;                     // 是否软断言
  successMessage: string;              // 成功消息
  assertMessage: string;               // 断言消息
  errorMessage: string;                // 错误消息
  error: Error;                        // 错误对象
  args: any[];                         // 断言参数
  originalMethod: string;              // 原始方法名
}
```

## 与 testring 框架集成

在 testring 测试中使用：

```typescript
import { createAssertion } from '@testring/async-assert';

// 在测试文件中
const assert = createAssertion();

describe('用户管理测试', () => {
  it('应该能够创建用户', async () => {
    const user = await createUser({ name: 'John', age: 25 });
    
    await assert.equal(user.name, 'John', '用户名应该正确');
    await assert.equal(user.age, 25, '年龄应该正确');
    await assert.property(user, 'id', '应该有用户ID');
    await assert.isString(user.id, 'ID应该是字符串');
  });
});
```

## 性能优化

### 批量断言
```typescript
// 软断言模式下的批量验证
const assert = createAssertion({ isSoft: true });

const validateUser = async (user) => {
  await assert.isString(user.name, '姓名必须是字符串');
  await assert.isNumber(user.age, '年龄必须是数字');
  await assert.isAbove(user.age, 0, '年龄必须大于0');
  await assert.isBelow(user.age, 150, '年龄必须小于150');
  await assert.match(user.email, /\S+@\S+\.\S+/, '邮箱格式无效');
  
  return assert._errorMessages;
};
```

## 错误处理最佳实践

```typescript
const assert = createAssertion({
  isSoft: true,
  onError: async (data) => {
    // 记录详细的断言失败信息
    console.error(`断言失败: ${data.originalMethod}`);
    console.error(`参数: ${JSON.stringify(data.args)}`);
    console.error(`错误: ${data.errorMessage}`);
    
    // 可以发送到监控系统
    // sendToMonitoring(data);
  }
});
```

## 依赖

- `chai` - 底层断言库
- `@testring/types` - 类型定义

## 相关模块

- `@testring/test-worker` - 测试工作进程
- `@testring/api` - 测试 API 控制器
- `@testring/logger` - 日志系统
