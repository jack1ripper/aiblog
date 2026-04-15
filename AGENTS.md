# AI 开发规范（AGENTS.md）

## 自动执行指令（每次新对话必读）

> 本文件已被 Kimi Code 自动读取。你**必须**立即执行以下步骤，**不允许**先问用户"你想做什么"。

### Step 1: 读取路由器
读取 `project-docs/00-index.md`。

### Step 2: 任务路由
根据 `00-index.md` 中的"任务路由表"，判断当前上下文可能涉及的任务类型，并**只读取**对应的 2-4 个相关文档。
- 如果无法判断任务类型，默认读取：`01-overview.md` + `02-requirements.md` + `03-tech-stack.md`

### Step 3: 读取任务清单
读取 `tasks/current.md`，找出所有未勾选的任务。

### Step 4: 汇报理解（必须完成此步才能进入下一步）
向用户发送以下格式的理解摘要：

```
## 项目理解确认

**核心愿景**：
**当前未完成任务**：
**相关技术约束**：
**本次对话建议处理的任务**：

请确认以上理解是否正确，或告诉我本次对话要处理的具体任务编号。
```

**在收到用户确认之前，禁止写任何代码、禁止修改任何文件。**

---

## 核心红线

1. **禁止依赖记忆**：不假设任何项目背景，一切引用文档或代码原文
2. **不确定时说不知道**：禁止编造答案
3. **文档优先于实现**：技术决策必须引用 `project-docs/` 原文
4. **小步验证**：一次只做 1-2 个 task，测试不过不进入下一步

## 多子项目红线

- `AGENTS.md` 和 `project-docs/` 必须在当前子项目根目录
- **禁止**在外层父目录加载文档

## 通用代码纪律

- 优先使用已有依赖，新增依赖必须说明理由并验证真实存在
- 禁止硬编码密钥、拼接 SQL、执行用户输入的字符串
- 每个 task 完成后：启动 dev 服务器供验证 → 更新 `tasks/current.md` → `git commit` → **`git push`**
- 涉及架构变更必须写入 `decisions/YYYY-MM-DD-<标题>.md`

## Next.js / React 前端开发红线（强制）

> 以下问题**必须避免再次踩坑**。修改相关代码前，**优先查阅对应依赖/框架官方文档**，禁止凭记忆假设 API 行为。

### 1. react-markdown 渲染规则
- **禁止依赖 `props.inline`**：react-markdown v9+ 的 `code` 组件已移除 `inline` prop。
- 区分 block/inline code 时，应通过自定义 `pre` 组件 + Context（或类似机制），利用 `pre > code` 的父子结构判断，**禁止**把 `<div>` 渲染进 `<p>` 导致非法嵌套和 hydration error。

### 2. Hydration 一致性（Client Component SSR）
- Client Component 中若使用浏览器 API（`window`、`document`、`navigator`）、`useTheme()`、随机数或 locale 相关格式化，**必须保证 SSR 与客户端首次渲染输出一致**。
- **推荐做法**：使用 `mounted` state + `useEffect` 控制差异逻辑，未 mount 前渲染静态 fallback，杜绝 hydration mismatch。
- **禁止**在渲染路径里写 `typeof window !== 'undefined'` 分支。

### 3. 主题样式适配
- **禁止**在通用 UI 组件（按钮、浮层、图标）中硬编码 `text-white`、`bg-white/5` 等固定颜色。
- 必须使用项目设计系统 token（如 `bg-muted`、`text-foreground`、`border-border`、`bg-accent`），确保 light/dark 双主题下均可见。

## 自动测试与推送纪律（强制执行）

> 每完成一个 task，**自动启动开发服务器**（`npm run dev`），并执行以下验证步骤：
>
> 1. 使用 `curl` 检查关键页面/API 是否正常（HTTP 200、无服务端报错）。
> 2. **使用 Chrome DevTools MCP 打开浏览器**，访问相关页面，检查：
>    - 页面渲染是否正常（无空白、无布局错位）。
>    - 样式是否与预期一致（light/dark 双主题）。
>    - 关键交互是否可用（按钮、表单提交、弹窗、导航等）。
>    - 浏览器控制台是否有报错（error / warning）。
> 3. 若涉及表单或后台功能，**必须手动输入测试数据**并提交，确认数据流转正确。
>
> 验证通过后，更新 `tasks/current.md` → `git commit` → **`git push`**。
> 发现 bug 立即修复，push 失败须明确报告原因，禁止假装已完成。

## 质量门禁（必须暂停并请示）

- 删除/大幅修改核心逻辑
- 引入新的外部依赖
- 测试覆盖率下降
- 需求与实现冲突

---

## 子代理使用规范（Sub-Agent）

### 何时必须创建子代理

| 场景 | 动作 |
|------|------|
| 任务涉及 ≥3 个文件且跨领域（前端+后端） | 必须先创建 Plan agent 做预规划 |
| 需要同时搜索多个不相关代码区域 | 并行创建 2-3 个 Explore agent |
| 涉及 Go / Python / Kotlin 代码修改 | 修改后必须调用对应的 language reviewer agent |
| 涉及用户输入、API 边界、敏感数据 | 修改后必须调用 security-reviewer agent |
| 有前端页面改动 | 修改后必须调用 e2e-runner agent 做浏览器验证 |
| 架构级重构或重大设计决策 | 必须调用 architect agent |

### 分层代理模型（Orchestrator Pattern）

- **父代理（当前会话）**：只负责任务路由、读取文档、调用子代理、整合结果、更新 `tasks/current.md`、触发 `ScheduleWakeup`。
- **子代理**：只负责被委托的单一职责（研究、规划、编码、审查、测试）。
- **禁止子代理再创建子代理**：避免嵌套过深导致不可控。

### 并行与串行执行规范

- **可并行**：独立的代码搜索、互不依赖的文件修改前的多领域 review、独立的测试任务。
- **必须串行**：有依赖关系的代码修改（A 文件被 B 文件 import）、先 review 后 commit 的流程。
- **默认策略**：先并行做研究与规划，再串行执行与验证。

### 常用子代理类型速查表

| 子代理类型 | 用途 |
|-----------|------|
| `Explore` | 快速搜索代码库、定位文件 |
| `Plan` | 复杂任务的预规划设计 |
| `everything-claude-code:code-reviewer` | 通用代码质量审查 |
| `everything-claude-code:go-reviewer` | Go 代码审查 |
| `everything-claude-code:python-reviewer` | Python 代码审查 |
| `everything-claude-code:security-reviewer` | 安全漏洞扫描 |
| `everything-claude-code:e2e-runner` | 浏览器自动化测试 |
| `everything-claude-code:architect` | 架构决策评估 |

### 委托与验证纪律

1. **不信任子代理的口头总结**：子代理报告完成后，父代理必须检查实际文件修改（`Read` 关键文件或 `git diff`）。
2. **子代理失败时停止推进**：如果子代理返回错误、测试未通过、review 未通过，禁止继续下一步，必须将 blocker 写入 `tasks/current.md`。
3. **子代理的上下文隔离**：使用 `isolation: "worktree"` 进行高风险实验性修改，完成后由父代理决定是否合并结果。

### 上下文清理与熔断纪律

- **每完成 1-3 个 tasks 后**，父代理必须主动更新 `tasks/current.md`，并可调用 `ScheduleWakeup(delaySeconds=60~300)` 进入下一轮，以控制单一会话上下文长度。
- **总 token 接近上限征兆**（响应明显变慢、出现无关联想）时，立即停止当前工作，保存进度到 `tasks/current.md`，并建议用户开启新会话继续。
- **浏览器测试失败连续 2 次**：停止自动化循环，记录 blocker，等待人工介入。
