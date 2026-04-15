#!/usr/bin/env python3
import fcntl
import os
import subprocess
import sys
from datetime import datetime

PROJECT_DIR = "/Users/dengxiang/2026/aiblog"
LOCK_FILE = "/tmp/auto-claude-aiblog.lock"

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def main():
    print("=========================================")
    print("Auto Claude Coding Test")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=========================================")

    try:
        lock_fd = os.open(LOCK_FILE, os.O_RDWR | os.O_CREAT)
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except (IOError, OSError):
        log("上一个任务仍在运行，跳过本次调度")
        sys.exit(0)

    os.write(lock_fd, str(os.getpid()).encode())
    os.chdir(PROJECT_DIR)

    log("开始测试 claude headless 编码任务...")

    prompt = (
        "读取 tasks/current.md，找出第一个状态为'待办'的任务编号和标题。"
        "然后运行 'echo test-from-headless > /tmp/claude-headless-marker.txt'。"
        "最后只输出任务编号和标题，不要多余解释。"
    )

    cmd = [
        "claude", "-p",
        "--permission-mode", "acceptEdits",
        prompt
    ]

    try:
        result = subprocess.run(cmd, timeout=300, capture_output=False)
        if result.returncode == 0:
            log("claude 正常退出")
        else:
            log(f"claude 异常退出，exit code: {result.returncode}")
    except subprocess.TimeoutExpired:
        log("任务超时（5分钟），强制终止")

    if os.path.exists("/tmp/claude-headless-marker.txt"):
        with open("/tmp/claude-headless-marker.txt") as f:
            content = f.read().strip()
        log(f"标记文件内容: {content}")
    else:
        log("标记文件未生成，Bash 工具可能未执行")

    log("测试结束")

if __name__ == "__main__":
    main()
