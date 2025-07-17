// 全局测试设置
// 在所有测试开始前设置进程监听器限制，避免 MaxListenersExceededWarning

// 设置足够大的监听器限制以避免警告
// 这是因为 Playwright 和测试框架会注册多个进程监听器
// 在大型测试套件中，可能需要更大的限制
process.setMaxListeners(200);

// 可选：如果需要调试监听器问题，可以启用以下代码
// const originalAddListener = process.addListener;
// process.addListener = function(event: string, listener: (...args: any[]) => void) {
//     console.log(`Adding listener for event: ${event}, current count: ${process.listenerCount(event)}`);
//     return originalAddListener.call(this, event, listener);
// };

console.log('Test setup: Set process max listeners to 200');
