#!/bin/bash

# 清理 Playwright 相关进程的脚本

echo "开始清理 Playwright 相关进程..."

# 1. 查找并清理 Playwright Chromium 进程
echo "正在清理 Chromium 进程..."
CHROMIUM_PIDS=$(pgrep -f "playwright.*chrom" | grep -v "$$")
if [ -n "$CHROMIUM_PIDS" ]; then
    echo "发现 Chromium 进程: $CHROMIUM_PIDS"
    kill $CHROMIUM_PIDS 2>/dev/null || true
    sleep 2
    # 强制清理仍然存在的进程
    REMAINING_PIDS=$(pgrep -f "playwright.*chrom" | grep -v "$$")
    if [ -n "$REMAINING_PIDS" ]; then
        echo "强制清理剩余进程: $REMAINING_PIDS"
        kill -9 $REMAINING_PIDS 2>/dev/null || true
    fi
fi

# 2. 查找并清理 browser-proxy 进程
echo "正在清理 browser-proxy 进程..."
PROXY_PIDS=$(pgrep -f "browser-proxy.*playwright" | grep -v "$$")
if [ -n "$PROXY_PIDS" ]; then
    echo "发现 browser-proxy 进程: $PROXY_PIDS"
    kill $PROXY_PIDS 2>/dev/null || true
    sleep 1
    # 强制清理仍然存在的进程
    REMAINING_PROXY_PIDS=$(pgrep -f "browser-proxy.*playwright" | grep -v "$$")
    if [ -n "$REMAINING_PROXY_PIDS" ]; then
        echo "强制清理剩余 browser-proxy 进程: $REMAINING_PROXY_PIDS"
        kill -9 $REMAINING_PROXY_PIDS 2>/dev/null || true
    fi
fi

# 3. 清理临时文件
echo "正在清理临时文件..."
find /var/folders -name "playwright_chromiumdev_profile-*" -type d -exec rm -rf {} + 2>/dev/null || true

echo "Playwright 进程清理完成!"

# 验证清理结果
REMAINING_PROCS=$(pgrep -f "playwright.*chrom" | grep -v "$$" || true)
if [ -n "$REMAINING_PROCS" ]; then
    echo "警告: 仍有一些进程未被清理: $REMAINING_PROCS"
else
    echo "所有 Playwright 进程已成功清理"
fi