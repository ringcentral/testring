# Ubuntu 测试失败报告问题

## 问题描述

在 Ubuntu 环境下运行 E2E 测试时，发现测试实际失败了（如断言错误），但在最终的整体报告中却显示为成功。这个问题只在 Ubuntu 下出现，其他操作系统（如 macOS、Windows）工作正常。

## 问题症状

1. 测试日志显示明确的失败信息：
   ```
   1:40:17 PM | info | main | [step end] Test failed AssertionError: [assert] include(exp = "Success", inc = "Example")
   1:40:17 PM | error | main | [worker-controller] AssertionError: [assert] include(exp = "Success", inc = "Example")
   ```

2. 但最终报告显示测试通过，没有反映失败状态

3. CI 流水线可能显示绿色（成功），尽管实际有测试失败

## 根本原因

### 1. 进程错误传播问题

在 `packages/e2e-test-app/src/test-runner.ts` 中，子进程的错误处理不够健壮：

```typescript
// 原始代码问题
const testringProcess = childProcess.exec(
    `node ${testringFile} ${args.join(' ')}`,
    {},
    (error, _stdout, _stderr) => {
        mockWebServer.stop();
        if (error) {
            throw error; // 这里抛出错误，但可能被忽略
        }
    },
);
```

### 2. 平台特定的进程管理差异

Ubuntu/Linux 下的进程管理和错误传播机制与其他操作系统存在差异，特别是在 CI 环境中。

### 3. 异步错误处理时序问题

错误处理回调和进程退出事件之间存在时序竞争，导致错误状态丢失。

## 解决方案

### 1. 改进 test-runner.ts 错误处理

```typescript
async function runTests() {
    await mockWebServer.start();

    return new Promise<void>((resolve, reject) => {
        const testringProcess = childProcess.exec(
            `node ${testringFile} ${args.join(' ')}`,
            {},
            (error, _stdout, _stderr) => {
                mockWebServer.stop();

                if (error) {
                    console.error('[test-runner] Test execution failed:', error.message);
                    console.error('[test-runner] Exit code:', error.code);
                    console.error('[test-runner] Signal:', error.signal);
                    reject(error);
                } else {
                    console.log('[test-runner] Test execution completed successfully');
                    resolve();
                }
            },
        );

        // 添加进程退出事件处理
        testringProcess.on('exit', (code, signal) => {
            console.log(`[test-runner] Process exited with code: ${code}, signal: ${signal}`);
            if (code !== 0 && code !== null) {
                const error = new Error(`Test process exited with non-zero code: ${code}`);
                (error as any).code = code;
                (error as any).signal = signal;
                mockWebServer.stop();
                reject(error);
            }
        });

        testringProcess.on('error', (error) => {
            console.error('[test-runner] Process error:', error);
            mockWebServer.stop();
            reject(error);
        });
    });
}

runTests().catch((error) => {
    console.error('[test-runner] Fatal error:', error.message);
    console.error('[test-runner] Stack:', error.stack);
    process.exit(error.code || 1);
});
```

### 2. 改进 CLI 错误处理

在 `core/cli/src/commands/runCommand.ts` 中：

```typescript
if (testRunResult) {
    this.logger.error('Founded errors:');

    testRunResult.forEach((error, index) => {
        this.logger.error(`Error ${index + 1}:`, error.message);
        this.logger.error('Stack:', error.stack);
    });

    const errorMessage = `Failed ${testRunResult.length}/${tests.length} tests.`;
    this.logger.error(errorMessage);
    
    // 确保正确设置退出码
    const error = new Error(errorMessage);
    (error as any).exitCode = 1;
    (error as any).testFailures = testRunResult.length;
    (error as any).totalTests = tests.length;
    
    throw error;
}
```

### 3. 平台特定处理

添加针对 Linux/Ubuntu 的特殊处理：

```typescript
// 在 Linux/Ubuntu CI 环境中更严格的错误检测
if (isLinux && isCI) {
    if ((code !== 0 && code !== null) || signal) {
        const error = new Error(`Test process exited with non-zero code: ${code}, signal: ${signal}`);
        (error as any).code = code;
        (error as any).signal = signal;
        mockWebServer.stop();
        reject(error);
        return;
    }
}
```

## 验证修复

使用提供的测试脚本验证修复：

```bash
node test-error-handling.js
```

该脚本会：
1. 运行已知会失败的测试
2. 检查是否正确报告失败
3. 验证改进的错误日志是否存在

## 预防措施

1. **监控 CI 日志**：定期检查 CI 日志，确保测试失败被正确报告
2. **使用严格模式**：在 CI 环境中使用 `--bail` 参数，测试失败时立即停止
3. **添加健康检查**：在 CI 流水线中添加额外的验证步骤
4. **平台测试**：确保在所有目标平台上测试错误处理机制

## 相关文件

- `packages/e2e-test-app/src/test-runner.ts` - 主要修复
- `core/cli/src/commands/runCommand.ts` - CLI 错误处理改进
- `core/cli/src/index.ts` - 主入口错误处理
- `core/test-run-controller/src/test-run-controller.ts` - 测试控制器改进
