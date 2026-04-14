# AI 辅助开发快速参考（WORKFLOW）

## 核心原则

**"文档即上下文，规格即源头"**

## 新对话启动流程

### Step 1: 固定 Prompt

```text
请按以下步骤开始：
1. 读 AGENTS.md
2. 读 project-docs/00-index.md
3. 按 00-index.md 的任务路由，只读与本次任务相关的 2-4 个文档
4. 读 tasks/current.md
5. 向我汇报你的理解，确认之前不写代码
```

### Step 2: 指派任务

```text
本次只处理 tasks/current.md 中的 TASK-XXX：
（任务描述）

完成后：运行测试 → 更新 tasks/current.md → git commit → git push
```

### Step 3: 验收 checklist

- [ ] 代码逻辑正确
- [ ] `npm run build` 通过，无 TS/Lint 错误
- [ ] 以 QA 视角完成前端+后端自我测试
- [ ] `tasks/current.md` 已更新
- [ ] `git log` 有新提交且已自动 push（或明确报告失败原因）

## 纪律

1. 新对话必加载文档
2. 一次只做 1-2 个任务
3. **每改完代码自动运行构建**
4. **必须主动以 QA 视角检查前后端 bug**
5. 每个 task 完成后自动 git commit 并 git push
6. 禁止无理由引入新依赖
7. 技术决策必须引用文档
8. 文档与代码冲突时先修文档
9. 不确定时说"我不知道"
