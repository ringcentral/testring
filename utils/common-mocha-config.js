/**
 * 通用的Mocha配置
 * 可以被其他包的.mocharc.json文件引用
 */

// 根据环境变量确定timeout值
const isCI = process.env.CI === 'true';
const isDebug = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'debug';

// 基础timeout配置（毫秒）
const BASE_TIMEOUTS = {
    // 标准测试timeout
    standard: 30000,
    
    // 快速测试timeout（适用于简单的单元测试）
    fast: 8000,
    
    // 长时间运行的测试timeout
    extended: 60000,
    
    // 调试模式timeout (无限制)
    debug: 0
};

/**
 * 获取timeout配置
 * @param {string} type - timeout类型 ('standard', 'fast', 'extended', 'debug')
 * @returns {number} timeout值（毫秒）
 */
function getTimeout(type = 'standard') {
    if (isDebug) {
        return BASE_TIMEOUTS.debug;
    }
    
    let baseTimeout = BASE_TIMEOUTS[type] || BASE_TIMEOUTS.standard;
    
    // CI环境下稍微减少timeout
    if (isCI && baseTimeout > 0) {
        baseTimeout = Math.round(baseTimeout * 0.8);
    }
    
    return baseTimeout;
}

/**
 * 生成Mocha配置对象
 * @param {string} timeoutType - timeout类型
 * @param {object} additionalConfig - 额外的配置项
 * @returns {object} Mocha配置对象
 */
function createMochaConfig(timeoutType = 'standard', additionalConfig = {}) {
    const baseConfig = {
        require: ['../../utils/ts-mocha.js'],
        'watch-extensions': 'ts',
        timeout: getTimeout(timeoutType),
        reporter: 'dot',
        spec: 'test/**/*.spec.ts'
    };
    
    return { ...baseConfig, ...additionalConfig };
}

module.exports = {
    getTimeout,
    createMochaConfig,
    BASE_TIMEOUTS
}; 