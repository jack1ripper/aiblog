# 自治循环与多代理编排（Autonomous Loop）

> 本文档定义如何在单个 Claude Code 会话中，通过子代理（Sub-Agent）和 `ScheduleWakeup` 实现半自动连续开发。

---

## 1. 自治循环概述

**目标**：用户发出启动指令后，AI 能够自动按 `tasks/current.md` 连续处理多个 tasks，期间无需人工确认，直至遇到 blocker 或全部完成。

**核心设计**：
- **父代理**（当前会话） = 调度器 + 状态机
- **子代理** = 专业技能执行单元
- **文档** = 唯一可信的状态源
- **`ScheduleWakeup`** = 控制会话上下文长度的节拍器

---

## 2. 子代理标准流水线

每个 task 必须按以下顺序执行，不得跳过验证步骤。

```
┌─────────────────┐
│ 1. 读取与路由    │  父代理读取 00-index.md + 相关 project-docs
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. 复杂度判断    │  简单任务直接执行；复杂任务创建 Plan agent
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. 研究与定位    │  并行创建 Explore agent 搜索代码库
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. 执行代码修改  │  父代理或 Execute agent 修改代码
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. 自动构建      │  运行 `npm run build` / `go build` / 等
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. 子代理审查    │  按领域调用 reviewer agent（code / go / python / security）
└────────┬────────┘
         ▼
┌─────────────────┐
│ 7. 浏览器/集成测试 │ e2e-runner agent 或父代理直接用 MCP 浏览器验证
└────────┬────────┘
         ▼
┌─────────────────┐
│ 8. 提交与更新    │  git commit → git push → 更新 tasks/current.md
└────────┬────────┘
         ▼
┌─────────────────┐
│ 9. 节拍控制      │  调用 ScheduleWakeup 或直接进入下一个 task
└─────────────────┘
```

---

## 3. 项目类型的测试策略

### 3.1 前后端分离 Blog 项目

任何前端改动（UI、样式、路由、组件）完成后，**必须**执行以下浏览器验证：

1. `mcp__chrome-devtools__navigate_page` 打开本地 dev server（如 `http://localhost:3000`）
2. 导航到改动涉及的页面
3. `mcp__chrome-devtools__take_screenshot` 截图保存
4. 如果是交互组件，使用 `mcp__chrome-devtools__click` / `fill` 验证交互
5. 如果是性能相关改动，可运行 `mcp__chrome-devtools__lighthouse_audit`

后端改动（API、数据库、服务层）完成后：
1. 运行对应的单元测试 / 集成测试
2. 如果是新 API，使用 `curl` 或测试脚本验证端点响应

### 3.2 Chroma RAG 知识库项目

- **向量数据库操作**：修改后必须运行集成测试，验证 `chroma_client` 连接和检索结果
- **文档处理管道**：修改后必须运行端到端测试，验证从文件上传到向量化的完整链路
- **API 服务层**：同 Blog 后端验证策略
- 前端界面（如有管理后台）：同 Blog 前端浏览器验证策略

---

## 4. ScheduleWakeup 使用策略

### 4.1 为什么需要 ScheduleWakeup

Claude Code 单一会话的上下文会随任务量增加而累积，最终触发 compaction 甚至产生幻觉。`ScheduleWakeup` 的作用是在完成一个 task 后，**主动结束当前思考轮次**，由系统在一段时间后唤醒继续，这相当于给上下文做一次"呼吸"。

### 4.2 延迟时间选择指南

| 场景 | 建议延迟 |
|------|---------|
| 刚刚完成简单代码修改，构建很快 | 60 - 120 秒 |
| 完成复杂任务，需要等待 dev server 冷却 | 180 - 300 秒 |
| 刚刚运行了 e2e 测试或 Lighthouse | 300 秒 |
| 已连续完成 3 个 tasks，建议暂停 | 600 秒 |

### 4.3 Prompt 规范

唤醒 prompt 必须包含足够上下文，让下一个唤醒的 Agent 能无缝继续：

```text
继续处理 `tasks/current.md` 中的下一个未完成任务。上一个任务（TASK-XXX）已完成并提交。
```

---

## 5. 失败处理与 Blocker 记录

### 5.1 何时停止自治循环

- 同一 task 连续失败 **2 次**
- 构建错误无法在当前会话内定位根因
- 子代理返回结果与代码实际状态严重不符
- 需求与文档/实现冲突，且无明确决策依据
- 单一会话已完成 **5 个 tasks**（建议保存进度，由用户决定是否继续）

### 5.2 Blocker 记录格式

当自治循环停止时，必须在 `tasks/current.md` 的对应 task 下方添加 blocker 记录：

```markdown
### BLOCKER: YYYY-MM-DD HH:mm
- **Task**: TASK-XXX
- **原因**: （构建失败 / 测试未通过 / 需求不明确 / 子代理异常 / 上下文过长）
- **详情**: （具体错误信息或观察到的异常）
- **建议**: （需要人工做什么才能继续）
```

---

## 6. 上下文管理技巧

### 6.1 父代理的减负原则

- 不要让父代理亲自写大量代码，只写最核心或最少量文件
- 复杂修改委托给专门的执行子代理
- 研究结果由子代理总结，父代理只保留"结论 + 文件路径 + 行号"

### 6.2 信息传递的最小化

子代理返回的结果应使用以下结构：

```markdown
## 结果摘要
- **状态**: 成功 / 失败 / 部分完成
- **修改文件**: `path/to/file.ts`, `path/to/file2.ts`
- **关键结论**: （一句话）
- **下一步依赖**: （如果有）
```

父代理不应把子代理的完整推理过程带入下一步。

---

## 7. 完整示例：一个自动化循环

**用户输入**：

```text
进入自动化模式，把今天的任务做完。
```

**AI 行为**：

1. 读取 `AGENTS.md` → `project-docs/00-index.md` → `tasks/current.md`
2. 发现未完成任务：`TASK-101`、`TASK-102`、`TASK-103`
3. 处理 `TASK-101`（简单，1 个文件）：
   - 直接修改 → build → QA 自查 → git commit/push → 更新 current.md
   - `ScheduleWakeup(delaySeconds=120)`
4. 唤醒后处理 `TASK-102`（复杂，跨前后端）：
   - 创建 `Plan` agent 写方案
   - 并行创建 2 个 `Explore` agent 搜索前后端代码
   - 按方案修改代码 → build
   - 创建 `code-reviewer` agent 审查
   - 创建 `e2e-runner` agent 跑浏览器测试
   - 全部通过 → git commit/push → 更新 current.md
   - `ScheduleWakeup(delaySeconds=180)`
5. 唤醒后处理 `TASK-103`：
   - 同 TASK-101 流程
6. 所有任务完成，向用户发送总结报告。

---

## 8. 纪律 checklist

- [ ] 每个 task 开始前已读取相关 project-docs
- [ ] 复杂任务必须先经过 Plan agent
- [ ] 代码修改后自动运行构建
- [ ] 前端改动后通过浏览器 MCP 验证
- [ ] 子代理结果已通过 `Read` / `git diff` 验证
- [ ] 每个 task 完成后更新 `tasks/current.md`
- [ ] 使用 `ScheduleWakeup` 控制上下文长度
- [ ] 遇到 blocker 立即停止并记录，不强行推进
