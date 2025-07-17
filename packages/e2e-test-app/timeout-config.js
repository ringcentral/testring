/**
 * 统一的Timeout配置
 * 支持不同环境和操作类型的timeout设置
 */

const isLocal = process.env.NODE_ENV === 'development' || process.env.LOCAL === 'true';
const isCI = process.env.CI === 'true';
const isDebug = process.env.DEBUG === 'true' || process.env.PLAYWRIGHT_DEBUG === '1';

/**
 * 基础timeout配置（毫秒）
 */
const BASE_TIMEOUTS = {
  // 快速操作
  fast: {
    click: 2000,           // 点击操作
    hover: 1000,           // 悬停操作
    fill: 2000,            // 填充操作
    key: 1000,             // 键盘操作
  },
  
  // 中等操作
  medium: {
    waitForElement: 10000,  // 等待元素
    waitForVisible: 10000,  // 等待可见
    waitForClickable: 8000, // 等待可点击
    waitForEnabled: 5000,   // 等待可用
    waitForStable: 5000,    // 等待稳定
    condition: 5000,        // 等待条件
  },
  
  // 慢速操作
  slow: {
    pageLoad: 30000,        // 页面加载
    navigation: 30000,      // 导航
    networkRequest: 15000,  // 网络请求
    waitForValue: 15000,    // 等待值
    waitForSelected: 15000, // 等待选择
  },
  
  // 非常慢的操作
  verySlow: {
    testExecution: 30000,   // 单个测试执行
    clientSession: 900000,  // 客户端会话 (15分钟)
    pageLoadMax: 180000,    // 页面加载最大时间 (3分钟)
    globalTest: 900000,     // 全局测试超时 (15分钟)
  },
  
  // 清理操作
  cleanup: {
    traceStop: 2000,        // 跟踪停止
    coverageStop: 2000,     // 覆盖率停止
    contextClose: 3000,     // 上下文关闭
    sessionClose: 2000,     // 会话关闭
    browserClose: 1500,     // 浏览器关闭
  }
};

/**
 * 环境相关的timeout倍数
 */
const ENVIRONMENT_MULTIPLIERS = {
  local: isLocal ? {
    fast: 2,      // 本地环境快速操作延长2倍
    medium: 2,    // 中等操作延长2倍
    slow: 1.5,    // 慢速操作延长1.5倍
    verySlow: 1,  // 非常慢的操作保持不变
    cleanup: 2,   // 清理操作延长2倍
  } : {},
  
  ci: isCI ? {
    fast: 0.8,    // CI环境快速操作缩短到80%
    medium: 0.8,  // 中等操作缩短到80%
    slow: 0.7,    // 慢速操作缩短到70%
    verySlow: 0.5, // 非常慢的操作缩短到50%
    cleanup: 0.8, // 清理操作缩短到80%
  } : {},
  
  debug: isDebug ? {
    fast: 10,     // 调试模式大幅延长
    medium: 10,   // 调试模式大幅延长
    slow: 5,      // 调试模式延长5倍
    verySlow: 2,  // 调试模式延长2倍
    cleanup: 5,   // 清理操作延长5倍
  } : {}
};

/**
 * 计算最终的timeout值
 */
function calculateTimeout(category, operation, baseValue = null) {
  const base = baseValue || BASE_TIMEOUTS[category][operation];
  if (!base) {
    throw new Error(`Unknown timeout: ${category}.${operation}`);
  }
  
  let multiplier = 1;
  
  // 应用环境倍数
  Object.values(ENVIRONMENT_MULTIPLIERS).forEach(envMultipliers => {
    if (envMultipliers[category]) {
      multiplier *= envMultipliers[category];
    }
  });
  
  return Math.round(base * multiplier);
}

/**
 * 导出的timeout配置
 */
const TIMEOUTS = {
  // 快速操作
  CLICK: calculateTimeout('fast', 'click'),
  HOVER: calculateTimeout('fast', 'hover'),
  FILL: calculateTimeout('fast', 'fill'),
  KEY: calculateTimeout('fast', 'key'),
  
  // 中等操作
  WAIT_FOR_ELEMENT: calculateTimeout('medium', 'waitForElement'),
  WAIT_FOR_VISIBLE: calculateTimeout('medium', 'waitForVisible'),
  WAIT_FOR_CLICKABLE: calculateTimeout('medium', 'waitForClickable'),
  WAIT_FOR_ENABLED: calculateTimeout('medium', 'waitForEnabled'),
  WAIT_FOR_STABLE: calculateTimeout('medium', 'waitForStable'),
  CONDITION: calculateTimeout('medium', 'condition'),
  
  // 慢速操作
  PAGE_LOAD: calculateTimeout('slow', 'pageLoad'),
  NAVIGATION: calculateTimeout('slow', 'navigation'),
  NETWORK_REQUEST: calculateTimeout('slow', 'networkRequest'),
  WAIT_FOR_VALUE: calculateTimeout('slow', 'waitForValue'),
  WAIT_FOR_SELECTED: calculateTimeout('slow', 'waitForSelected'),
  
  // 非常慢的操作
  TEST_EXECUTION: calculateTimeout('verySlow', 'testExecution'),
  CLIENT_SESSION: calculateTimeout('verySlow', 'clientSession'),
  PAGE_LOAD_MAX: calculateTimeout('verySlow', 'pageLoadMax'),
  GLOBAL_TEST: calculateTimeout('verySlow', 'globalTest'),
  
  // 清理操作
  TRACE_STOP: calculateTimeout('cleanup', 'traceStop'),
  COVERAGE_STOP: calculateTimeout('cleanup', 'coverageStop'),
  CONTEXT_CLOSE: calculateTimeout('cleanup', 'contextClose'),
  SESSION_CLOSE: calculateTimeout('cleanup', 'sessionClose'),
  BROWSER_CLOSE: calculateTimeout('cleanup', 'browserClose'),
  
  // 兼容性别名
  WAIT_TIMEOUT: calculateTimeout('medium', 'waitForElement'),
  TICK_TIMEOUT: 100,  // 保持原始的tick timeout
  
  // 工具函数
  custom: calculateTimeout,
  isLocal,
  isCI,
  isDebug
};

module.exports = TIMEOUTS; 