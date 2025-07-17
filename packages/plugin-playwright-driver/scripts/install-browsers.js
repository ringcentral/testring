#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

// 配置
const BROWSERS = ['chromium', 'firefox', 'webkit', 'msedge'];
const SKIP_ENV_VAR = 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD';
const BROWSERS_ENV_VAR = 'PLAYWRIGHT_BROWSERS';

// 颜色输出
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkSkipInstallation() {
    // 检查是否跳过浏览器安装
    if (process.env[SKIP_ENV_VAR] === '1' || process.env[SKIP_ENV_VAR] === 'true') {
        log('📛 跳过浏览器安装 (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1)', 'yellow');
        return true;
    }
    
    // 检查是否在 CI 环境中
    if (process.env.CI && !process.env.PLAYWRIGHT_INSTALL_IN_CI) {
        log('📛 CI 环境中跳过浏览器安装 (使用 PLAYWRIGHT_INSTALL_IN_CI=1 来强制安装)', 'yellow');
        return true;
    }
    
    return false;
}

function getBrowsersToInstall() {
    // 从环境变量获取要安装的浏览器列表
    const browsersEnv = process.env[BROWSERS_ENV_VAR];
    if (browsersEnv) {
        const browsers = browsersEnv.split(',').map(b => b.trim()).filter(b => b);
        log(`📦 从环境变量安装浏览器: ${browsers.join(', ')}`, 'cyan');
        return browsers;
    }
    
    // 默认安装所有浏览器
    return BROWSERS;
}

async function installBrowser(browser) {
    log(`📦 正在安装 ${browser}...`, 'blue');
    
    try {
        // 尝试正常安装
        await execAsync(`npx playwright install ${browser}`, { 
            stdio: 'inherit',
            timeout: 120000 // 2 分钟超时
        });
        
        log(`✅ ${browser} 安装成功`, 'green');
        return { browser, status: 'success' };
        
    } catch (error) {
        // 如果是 msedge 并且提示已存在，尝试强制重新安装
        if (browser === 'msedge' && error.stdout && error.stdout.includes('already installed')) {
            log(`⚠️  ${browser} 已存在，尝试强制重新安装...`, 'yellow');
            
            try {
                await execAsync(`npx playwright install --force ${browser}`, { 
                    stdio: 'inherit',
                    timeout: 120000 
                });
                
                log(`✅ ${browser} 强制重新安装成功`, 'green');
                return { browser, status: 'success' };
                
            } catch (forceError) {
                log(`❌ ${browser} 强制重新安装失败: ${forceError.message}`, 'red');
                return { browser, status: 'failed', error: forceError.message };
            }
        }
        
        log(`❌ ${browser} 安装失败: ${error.message}`, 'red');
        return { browser, status: 'failed', error: error.message };
    }
}

async function verifyInstallation() {
    try {
        log('🔍 验证浏览器安装...', 'cyan');
        const { stdout } = await execAsync('npx playwright install --list');
        
        const installedBrowsers = stdout.split('\n')
            .filter(line => line.trim().startsWith('/'))
            .map(line => {
                const parts = line.trim().split('/');
                return parts[parts.length - 1];
            });
        
        log(`📋 已安装的浏览器: ${installedBrowsers.join(', ')}`, 'green');
        
    } catch (error) {
        log(`⚠️  验证安装时出错: ${error.message}`, 'yellow');
    }
}

async function main() {
    log('🚀 Playwright 浏览器自动安装工具', 'magenta');
    log('=' .repeat(50), 'cyan');
    
    // 检查是否跳过安装
    if (checkSkipInstallation()) {
        return;
    }
    
    // 获取要安装的浏览器
    const browsersToInstall = getBrowsersToInstall();
    
    log(`📦 准备安装浏览器: ${browsersToInstall.join(', ')}`, 'cyan');
    
    // 安装浏览器
    const results = [];
    for (const browser of browsersToInstall) {
        const result = await installBrowser(browser);
        results.push(result);
    }
    
    // 输出结果
    log('\n📊 安装结果:', 'magenta');
    log('=' .repeat(30), 'cyan');
    
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    results.forEach(result => {
        const status = result.status === 'success' ? '✅' : '❌';
        log(`${status} ${result.browser}: ${result.status.toUpperCase()}`);
        if (result.error) {
            log(`   错误: ${result.error}`, 'red');
        }
    });
    
    log(`\n🎯 总结: ${successCount} 成功, ${failedCount} 失败`, 'cyan');
    
    // 验证安装
    if (successCount > 0) {
        await verifyInstallation();
    }
    
    // 输出使用提示
    log('\n💡 使用提示:', 'magenta');
    log('• 跳过浏览器安装: PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install', 'yellow');
    log('• 安装特定浏览器: PLAYWRIGHT_BROWSERS=chromium,firefox npm install', 'yellow');
    log('• CI 环境强制安装: PLAYWRIGHT_INSTALL_IN_CI=1 npm install', 'yellow');
    
    log('\n🎉 浏览器安装完成！', 'green');
    
    // 如果有失败的安装，非零退出码
    if (failedCount > 0) {
        process.exit(1);
    }
}

// 运行主函数
main().catch(error => {
    log(`💥 安装过程中出现错误: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
}); 