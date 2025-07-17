/**
 * Timeout配置验证器
 * 验证timeout配置的合理性和一致性
 */

const TIMEOUTS = require('./timeout-config.js');

/**
 * 验证timeout值是否合理
 * @param {number} timeout - timeout值（毫秒）
 * @param {string} name - timeout名称
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 是否有效
 */
function validateTimeout(timeout, name, min = 100, max = 3600000) {
    if (typeof timeout !== 'number' || isNaN(timeout)) {
        console.warn(`警告: ${name} timeout 不是有效数字: ${timeout}`);
        return false;
    }
    
    if (timeout < 0) {
        console.warn(`警告: ${name} timeout 不能为负数: ${timeout}`);
        return false;
    }
    
    if (timeout > 0 && timeout < min) {
        console.warn(`警告: ${name} timeout 过短 (${timeout}ms), 建议至少 ${min}ms`);
        return false;
    }
    
    if (timeout > max) {
        console.warn(`警告: ${name} timeout 过长 (${timeout}ms), 建议不超过 ${max}ms`);
        return false;
    }
    
    return true;
}

/**
 * 验证timeout配置的逻辑关系
 */
function validateTimeoutRelationships() {
    const issues = [];
    
    // 快速操作应该比中等操作快
    if (TIMEOUTS.CLICK > TIMEOUTS.WAIT_FOR_ELEMENT) {
        issues.push('点击timeout不应该大于等待元素timeout');
    }
    
    if (TIMEOUTS.HOVER > TIMEOUTS.WAIT_FOR_ELEMENT) {
        issues.push('悬停timeout不应该大于等待元素timeout');
    }
    
    // 页面加载应该比一般等待长
    if (TIMEOUTS.PAGE_LOAD < TIMEOUTS.WAIT_FOR_ELEMENT) {
        issues.push('页面加载timeout应该大于等待元素timeout');
    }
    
    // 客户端会话应该是最长的
    if (TIMEOUTS.CLIENT_SESSION < TIMEOUTS.PAGE_LOAD_MAX) {
        issues.push('客户端会话timeout应该大于页面加载最大timeout');
    }
    
    // 测试执行应该合理
    if (TIMEOUTS.TEST_EXECUTION < TIMEOUTS.PAGE_LOAD) {
        issues.push('测试执行timeout应该大于页面加载timeout');
    }
    
    return issues;
}

/**
 * 验证所有timeout配置
 */
function validateAllTimeouts() {
    console.log('🔍 验证timeout配置...');
    
    const validationResults = {
        // 快速操作验证
        click: validateTimeout(TIMEOUTS.CLICK, 'CLICK', 500, 10000),
        hover: validateTimeout(TIMEOUTS.HOVER, 'HOVER', 500, 10000),
        fill: validateTimeout(TIMEOUTS.FILL, 'FILL', 500, 10000),
        key: validateTimeout(TIMEOUTS.KEY, 'KEY', 500, 5000),
        
        // 中等操作验证
        waitForElement: validateTimeout(TIMEOUTS.WAIT_FOR_ELEMENT, 'WAIT_FOR_ELEMENT', 1000, 60000),
        waitForVisible: validateTimeout(TIMEOUTS.WAIT_FOR_VISIBLE, 'WAIT_FOR_VISIBLE', 1000, 60000),
        waitForClickable: validateTimeout(TIMEOUTS.WAIT_FOR_CLICKABLE, 'WAIT_FOR_CLICKABLE', 1000, 30000),
        condition: validateTimeout(TIMEOUTS.CONDITION, 'CONDITION', 1000, 30000),
        
        // 慢速操作验证
        pageLoad: validateTimeout(TIMEOUTS.PAGE_LOAD, 'PAGE_LOAD', 5000, 120000),
        navigation: validateTimeout(TIMEOUTS.NAVIGATION, 'NAVIGATION', 5000, 120000),
        networkRequest: validateTimeout(TIMEOUTS.NETWORK_REQUEST, 'NETWORK_REQUEST', 3000, 60000),
        
        // 非常慢的操作验证
        testExecution: validateTimeout(TIMEOUTS.TEST_EXECUTION, 'TEST_EXECUTION', 10000, 1800000),
        clientSession: validateTimeout(TIMEOUTS.CLIENT_SESSION, 'CLIENT_SESSION', 60000, 3600000),
        pageLoadMax: validateTimeout(TIMEOUTS.PAGE_LOAD_MAX, 'PAGE_LOAD_MAX', 30000, 600000),
        
        // 清理操作验证
        traceStop: validateTimeout(TIMEOUTS.TRACE_STOP, 'TRACE_STOP', 1000, 10000),
        coverageStop: validateTimeout(TIMEOUTS.COVERAGE_STOP, 'COVERAGE_STOP', 1000, 10000),
        contextClose: validateTimeout(TIMEOUTS.CONTEXT_CLOSE, 'CONTEXT_CLOSE', 1000, 15000),
    };
    
    // 检查关系合理性
    const relationshipIssues = validateTimeoutRelationships();
    
    // 统计结果
    const passedCount = Object.values(validationResults).filter(Boolean).length;
    const totalCount = Object.keys(validationResults).length;
    
    console.log(`✅ 验证完成: ${passedCount}/${totalCount} 项通过`);
    
    if (relationshipIssues.length > 0) {
        console.log('⚠️  配置逻辑问题:');
        relationshipIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    // 显示当前环境信息
    console.log(`🌍 当前环境: ${TIMEOUTS.isLocal ? '本地' : ''}${TIMEOUTS.isCI ? 'CI' : ''}${TIMEOUTS.isDebug ? '调试' : ''}`);
    
    return {
        validationResults,
        relationshipIssues,
        isValid: passedCount === totalCount && relationshipIssues.length === 0
    };
}

/**
 * 显示timeout配置摘要
 */
function showTimeoutSummary() {
    console.log('\n📊 Timeout配置摘要:');
    console.log('==================');
    
    console.log('\n🚀 快速操作:');
    console.log(`   点击:       ${TIMEOUTS.CLICK}ms`);
    console.log(`   悬停:       ${TIMEOUTS.HOVER}ms`);
    console.log(`   填充:       ${TIMEOUTS.FILL}ms`);
    console.log(`   按键:       ${TIMEOUTS.KEY}ms`);
    
    console.log('\n⏳ 中等操作:');
    console.log(`   等待元素:   ${TIMEOUTS.WAIT_FOR_ELEMENT}ms`);
    console.log(`   等待可见:   ${TIMEOUTS.WAIT_FOR_VISIBLE}ms`);
    console.log(`   等待可点击: ${TIMEOUTS.WAIT_FOR_CLICKABLE}ms`);
    console.log(`   等待条件:   ${TIMEOUTS.CONDITION}ms`);
    
    console.log('\n🐌 慢速操作:');
    console.log(`   页面加载:   ${TIMEOUTS.PAGE_LOAD}ms`);
    console.log(`   导航:       ${TIMEOUTS.NAVIGATION}ms`);
    console.log(`   网络请求:   ${TIMEOUTS.NETWORK_REQUEST}ms`);
    
    console.log('\n🏗️  系统级别:');
    console.log(`   测试执行:   ${TIMEOUTS.TEST_EXECUTION}ms`);
    console.log(`   客户端会话: ${TIMEOUTS.CLIENT_SESSION}ms`);
    console.log(`   页面加载最大: ${TIMEOUTS.PAGE_LOAD_MAX}ms`);
    
    console.log('\n🧹 清理操作:');
    console.log(`   跟踪停止:   ${TIMEOUTS.TRACE_STOP}ms`);
    console.log(`   覆盖率停止: ${TIMEOUTS.COVERAGE_STOP}ms`);
    console.log(`   上下文关闭: ${TIMEOUTS.CONTEXT_CLOSE}ms`);
    console.log('==================\n');
}

// 如果直接运行此文件，执行验证
if (require.main === module) {
    showTimeoutSummary();
    validateAllTimeouts();
}

module.exports = {
    validateTimeout,
    validateTimeoutRelationships,
    validateAllTimeouts,
    showTimeoutSummary
}; 