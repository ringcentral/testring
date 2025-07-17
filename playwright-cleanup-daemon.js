#!/usr/bin/env node

/**
 * Playwright 进程清理守护程序
 * 定期扫描并清理孤儿 Chromium 进程
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class PlaywrightCleanupDaemon {
    constructor(options = {}) {
        this.interval = options.interval || 30000; // 30秒检查一次
        this.maxAge = options.maxAge || 1800000; // 30分钟的进程认为是孤儿进程
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.registryFile = path.join(os.tmpdir(), 'testring-playwright-processes.json');
        this.isRunning = false;
        this.cleanupCount = 0;
    }

    log(message, force = false) {
        if (this.verbose || force) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${message}`);
        }
    }

    async findPlaywrightProcesses() {
        return new Promise((resolve) => {
            exec('pgrep -f "playwright.*chrom"', (error, stdout) => {
                if (error) {
                    resolve([]);
                    return;
                }
                
                const pids = stdout.trim().split('\n')
                    .filter(pid => pid && !isNaN(parseInt(pid)))
                    .map(pid => parseInt(pid));
                    
                resolve(pids);
            });
        });
    }

    async getProcessInfo(pid) {
        return new Promise((resolve) => {
            exec(`ps -o pid,ppid,etime,command -p ${pid}`, (error, stdout) => {
                if (error) {
                    resolve(null);
                    return;
                }
                
                const lines = stdout.trim().split('\n');
                if (lines.length < 2) {
                    resolve(null);
                    return;
                }
                
                const data = lines[1].trim().split(/\s+/);
                const etime = data[2]; // 运行时间
                const command = data.slice(3).join(' ');
                
                resolve({
                    pid: parseInt(data[0]),
                    ppid: parseInt(data[1]),
                    etime,
                    command,
                    startTime: this.parseEtime(etime)
                });
            });
        });
    }

    parseEtime(etime) {
        // 解析 ps 的 etime 格式 (如 "05:30" 或 "1-05:30:15")
        const now = Date.now();
        let seconds = 0;
        
        if (etime.includes('-')) {
            // 格式: days-hours:minutes:seconds
            const parts = etime.split('-');
            const days = parseInt(parts[0]);
            const timePart = parts[1];
            const [hours, minutes, secs] = timePart.split(':').map(x => parseInt(x));
            seconds = days * 86400 + hours * 3600 + minutes * 60 + (secs || 0);
        } else if (etime.split(':').length === 3) {
            // 格式: hours:minutes:seconds
            const [hours, minutes, secs] = etime.split(':').map(x => parseInt(x));
            seconds = hours * 3600 + minutes * 60 + secs;
        } else {
            // 格式: minutes:seconds
            const [minutes, secs] = etime.split(':').map(x => parseInt(x));
            seconds = minutes * 60 + secs;
        }
        
        return now - (seconds * 1000);
    }

    async isParentProcessAlive(ppid) {
        return new Promise((resolve) => {
            exec(`ps -p ${ppid}`, (error) => {
                resolve(!error);
            });
        });
    }

    async checkAndCleanup() {
        try {
            const pids = await this.findPlaywrightProcesses();
            
            if (pids.length === 0) {
                this.log('No Playwright processes found');
                return;
            }

            this.log(`Found ${pids.length} Playwright processes`);
            
            const orphanProcesses = [];
            const activeProcesses = [];

            for (const pid of pids) {
                const info = await this.getProcessInfo(pid);
                if (!info) continue;

                const age = Date.now() - info.startTime;
                const isParentAlive = await this.isParentProcessAlive(info.ppid);

                this.log(`Process ${pid}: age=${Math.round(age/1000)}s, parent=${info.ppid} (alive=${isParentAlive})`);

                // 判断是否为孤儿进程
                if (!isParentAlive || age > this.maxAge) {
                    orphanProcesses.push({
                        pid,
                        info,
                        reason: !isParentAlive ? 'parent_dead' : 'too_old'
                    });
                } else {
                    activeProcesses.push({ pid, info });
                }
            }

            if (orphanProcesses.length > 0) {
                this.log(`Found ${orphanProcesses.length} orphan processes to clean up`, true);
                
                for (const { pid, reason } of orphanProcesses) {
                    if (this.dryRun) {
                        this.log(`[DRY RUN] Would kill process ${pid} (reason: ${reason})`, true);
                    } else {
                        this.log(`Killing orphan process ${pid} (reason: ${reason})`, true);
                        try {
                            execSync(`kill ${pid}`, { stdio: 'ignore' });
                            
                            // 给进程一些时间优雅关闭
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // 检查是否还存在，如果是则强制关闭
                            try {
                                execSync(`ps -p ${pid}`, { stdio: 'ignore' });
                                this.log(`Force killing stubborn process ${pid}`);
                                execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
                            } catch (e) {
                                // 进程已经关闭
                            }
                            
                            this.cleanupCount++;
                        } catch (error) {
                            this.log(`Failed to kill process ${pid}: ${error.message}`);
                        }
                    }
                }
            } else {
                this.log(`All ${activeProcesses.length} processes appear to be active`);
            }

            // 清理临时文件
            await this.cleanupTempFiles();

        } catch (error) {
            this.log(`Error during cleanup check: ${error.message}`, true);
        }
    }

    async cleanupTempFiles() {
        try {
            if (this.dryRun) {
                this.log('[DRY RUN] Would clean up temporary Playwright profile directories');
            } else {
                execSync('find /var/folders -name "playwright_chromiumdev_profile-*" -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true');
                this.log('Cleaned up old temporary profile directories');
            }
        } catch (error) {
            this.log(`Error cleaning temp files: ${error.message}`);
        }
    }

    start() {
        if (this.isRunning) {
            this.log('Cleanup daemon is already running');
            return;
        }

        this.isRunning = true;
        this.log(`Starting Playwright cleanup daemon (interval: ${this.interval}ms, maxAge: ${this.maxAge}ms)`, true);

        // 立即执行一次清理
        this.checkAndCleanup();

        // 设置定期清理
        this.intervalId = setInterval(() => {
            this.checkAndCleanup();
        }, this.interval);

        // 处理进程退出
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    stop() {
        if (!this.isRunning) return;

        this.log(`Stopping cleanup daemon (cleaned ${this.cleanupCount} processes)`, true);
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        process.exit(0);
    }
}

// 命令行接口
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // 解析命令行参数
    args.forEach(arg => {
        switch (arg) {
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--help':
            case '-h':
                console.log(`
Usage: node playwright-cleanup-daemon.js [options]

Options:
  --dry-run    Show what would be cleaned up without actually doing it
  --verbose    Enable verbose logging
  --help       Show this help message

Environment variables:
  CLEANUP_INTERVAL    Cleanup check interval in milliseconds (default: 30000)
  CLEANUP_MAX_AGE     Max age for processes in milliseconds (default: 300000)
`);
                process.exit(0);
                break;
        }
    });

    // 从环境变量读取配置
    if (process.env.CLEANUP_INTERVAL) {
        options.interval = parseInt(process.env.CLEANUP_INTERVAL);
    }
    if (process.env.CLEANUP_MAX_AGE) {
        options.maxAge = parseInt(process.env.CLEANUP_MAX_AGE);
    }

    const daemon = new PlaywrightCleanupDaemon(options);
    daemon.start();
}

module.exports = PlaywrightCleanupDaemon;