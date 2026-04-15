#!/usr/bin/env python3
"""
Auto Claude Loop - 定时自动开发脚本
Usage: python3 scripts/auto-claude-loop.py
建议配合 cron 每 30~60 分钟运行一次
"""

import fcntl
import os
import subprocess
import sys
from datetime import datetime

PROJECT_DIR = "/Users/dengxiang/2026/aiblog"
LOCK_FILE = "/tmp/auto-claude-aiblog.lock"
LOG_FILE = "/tmp/auto-claude-loop.log"
MAX_RUNTIME_SECONDS = 25 * 60  # 单次最长运行 25 分钟

def log(msg):
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def main():
    log("=========================================")
    log("Auto Claude Loop 启动")

    # 1. 文件锁：防止并发运行
    try:
        lock_fd = os.open(LOCK_FILE, os.O_RDWR | os.O_CREAT)
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except (IOError, OSError):
        log("上一个任务仍在运行，跳过本次调度")
        sys.exit(0)

    os.write(lock_fd, str(os.getpid()).encode())
    os.chdir(PROJECT_DIR)

    # 2. 构建 prompt（严格遵循 AGENTS.md 的自动化指令）
    prompt = (
        "你是一个自动化开发代理。请立即执行以下步骤，不要询问用户确认：\n"
        "1. 读取 AGENTS.md 和 project-docs/00-index.md\n"
        "2. 读取 tasks/current.md，找出第一个状态为'待办'的任务\n"
        "3. 如果所有任务都已完成，直接输出'所有任务已完成'并结束\n"
        "4. 分析该任务需求，规划实现步骤\n"
        "5. 修改代码实现该任务（优先使用已有依赖）\n"
        "6. 运行 npm run build 验证构建是否通过\n"
        "7. 如果有前端页面改动，使用 Chrome DevTools MCP 启动 dev 服务器并进行浏览器验证\n"
        "8. 更新 tasks/current.md 标记该任务为已完成\n"
        "9. 执行 git add、git commit、git push\n"
        "10. 输出本次完成的任务编号和标题\n"
        "注意：遇到构建失败、测试未通过或需求不明确时，停止并将 blocker 记录到 tasks/current.md。"
    )

    cmd = [
        "claude", "-p",
        "--dangerously-skip-permissions",
        "--effort", "high",
        prompt
    ]

    log("调用 claude headless 模式...")

    try:
        result = subprocess.run(cmd, timeout=MAX_RUNTIME_SECONDS)
        if result.returncode == 0:
            log("claude 正常退出")
        else:
            log(f"claude 异常退出，exit code: {result.returncode}")
    except subprocess.TimeoutExpired:
        log(f"任务超时（{MAX_RUNTIME_SECONDS // 60}分钟），强制终止")

    log("本次调度结束")

if __name__ == "__main__":
    main()
