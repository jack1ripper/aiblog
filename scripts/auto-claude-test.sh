#!/bin/zsh

PROJECT_DIR="/Users/dengxiang/2026/aiblog"
LOCK_FILE="/tmp/auto-claude-aiblog.lock"

echo "========================================="
echo "Auto Claude Test Script"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 1. 尝试获取文件锁
LOCK_FD=200
exec {LOCK_FD}>"$LOCK_FILE"
if ! flock -n $LOCK_FD; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 上一个任务仍在运行，跳过本次调度"
  exit 0
fi

echo $$ >&$LOCK_FD

cd "$PROJECT_DIR" || exit 1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始测试 claude headless 模式..."

# 2. 调用 claude CLI 读取 tasks/current.md
# 限制最长运行 5 分钟，避免卡住
timeout 300s claude -p \
  --permission-mode acceptEdits \
  "读取 AGENTS.md 和 tasks/current.md，告诉我当前第一个未完成（状态为待办）的任务编号和标题。只输出一行答案，然后结束。"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 任务超时（5分钟），强制终止"
elif [ $EXIT_CODE -ne 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] claude 进程异常退出，exit code: $EXIT_CODE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 测试结束"
