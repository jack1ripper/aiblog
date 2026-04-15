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

---

## 半自动执行路径（无人值守模式）

> 本模式适用于：用户给出启动指令后离开，由 AI 自动按 `tasks/current.md` 连续完成多个 tasks。

### 触发条件

- **默认方式**：项目根目录 `.claude/settings.json` 已配置 `project-start` hook，每次进入本项目时 AI 会自动收到"进入自动化模式"的指令，无需用户手动粘贴
- **手动方式**：用户使用了类似"把今天的任务做完"、"自动处理剩余任务"、"进入自动化模式"等指令
- 或当前未完成任务数 ≥2 且用户明确表示"不用每一步都问我"

### 自动化流水线（每个 task 的标准流程）

```
读取 task → 判断复杂度 → [Plan agent 预规划] → 执行代码修改
    → 自动构建 → QA 自查 → [子代理 review] → [浏览器测试] → git commit & push
    → 更新 tasks/current.md → ScheduleWakeup(60s~300s) → 下一个 task
```

### 复杂度判断标准

- **简单任务**（1-2 个文件，单领域）：父代理直接执行，无需 Plan agent
- **复杂任务**（≥3 个文件，跨前后端，或涉及架构）：必须先创建 Plan agent 写执行方案

### ScheduleWakeup 使用规范

- 每完成 **1 个 task** 后调用 `ScheduleWakeup`，延迟 **120~300 秒**
- 如果刚刚经历了子代理并行研究，延迟可缩短至 **60 秒**
- 如果构建/测试耗时较长，延迟延长至 **300~600 秒**
- 唤醒时的 `prompt` 固定为："继续处理 `tasks/current.md` 中的下一个未完成任务"

### 开场白模板（用户可直接复制使用）

```text
进入自动化模式。请按以下步骤执行：
1. 读取 AGENTS.md 和 project-docs/00-index.md
2. 读取 tasks/current.md，找出所有未完成任务
3. 按顺序自动处理这些任务，使用子代理流水线
4. 每完成一个 task，自动构建、测试、commit、push，并更新 current.md
5. 完成后调用 ScheduleWakeup 继续下一个 task
6. 遇到 blocker（构建失败、测试未通过、需求不明确）时停止，并记录到 current.md
7. 全程不需要问我确认，除非触及质量门禁
```

### 子代理结果验收 checklist

- [ ] 子代理声称的修改已通过 `git diff` 或 `Read` 验证
- [ ] 构建命令（如 `npm run build`）已执行且无错误
- [ ] 前端改动已通过浏览器 MCP 验证（截图或交互确认）
- [ ] 后端改动已通过 API 测试或单元测试
- [ ] 相关 reviewer agent 已运行且无阻塞性意见
- [ ] `tasks/current.md` 已更新，当前 task 标记为完成
- [ ] `git log` 显示新提交且已成功 push（或已记录失败原因）

### 熔断规则（必须停止并等待人工）

1. 同一 task 连续失败 2 次
2. 构建错误无法在当前会话内定位根因
3. 子代理返回的结果与代码实际状态严重不符
4. 需求与现有实现冲突且文档未覆盖
5. 单一会话已完成 ≥5 个 tasks（建议保存进度，由用户决定是否继续）
