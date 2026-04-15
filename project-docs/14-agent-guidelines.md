# AI 协作详细规范

> 本文件存放通用流程、测试纪律与子代理规范。日常对话由 `AGENTS.md` 负责加载；复杂规划或跨领域任务时，可再读本文件作为参考。

## 核心原则

1. **禁止依赖记忆**：不假设任何项目背景，一切引用文档或代码原文。
2. **不确定时说不知道**：禁止编造答案。
3. **文档优先于实现**：技术决策必须引用 `project-docs/` 原文。
4. **小步验证**：一次只做 1-2 个 task，测试不过不进入下一步。

## 通用代码纪律

- 优先使用已有依赖，新增依赖必须说明理由并验证真实存在。
- 禁止硬编码密钥、拼接 SQL、执行用户输入的字符串。
- 每个 task 完成后：运行测试 → 更新 `tasks/current.md` → `git commit`（备注统一使用中文） → `git push`。
- 涉及架构变更必须写入 `decisions/YYYY-MM-DD-<标题>.md`。

## Next.js / React 前端开发红线

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

## 自动测试与推送纪律

- 每完成一个 task，**自动运行构建**（`npm run build`），然后以严格 QA 视角自查 bug：
  - 前端：样式生效、响应式、交互状态、空/错状态、hydration 错误
  - 后端：权限完整、数据不泄漏、参数边界、异常状态码正确
- 发现 bug **立即修复**，构建和自测全部通过后再 `git commit` 并 `git push`。
- 如果 push 失败，明确报告原因，禁止假装已完成。

## 质量门禁（必须暂停并请示用户）

- 删除/大幅修改核心逻辑
- 引入新的外部依赖
- 测试覆盖率下降
- 需求与实现冲突

## 子代理使用规范

### 何时建议创建子代理

| 场景 | 动作 |
|------|------|
| 任务涉及 ≥3 个文件且跨领域（前端+后端） | 建议先创建 Plan agent 做预规划 |
| 需要同时搜索多个不相关代码区域 | 并行创建 2-3 个 Explore agent |
| 涉及 Go / Python / Kotlin 代码修改 | 修改后视复杂度调用对应 language reviewer agent |
| 涉及用户输入、API 边界、敏感数据 | 修改后视风险调用 security-reviewer agent |
| 有较大前端页面改动 | 视复杂度调用 e2e-runner agent 做浏览器验证 |
| 架构级重构或重大设计决策 | 建议调用 architect agent |

### 分层代理模型（Orchestrator Pattern）

- **父代理（当前会话）**：负责任务路由、读取文档、调用子代理、整合结果、更新 `tasks/current.md`。
- **子代理**：只负责被委托的单一职责（研究、规划、编码、审查、测试）。
- **禁止子代理再创建子代理**：避免嵌套过深导致不可控。

### 委托与验证纪律

1. **不信任子代理的口头总结**：子代理报告完成后，父代理必须检查实际文件修改（`Read` 关键文件或 `git diff`）。
2. **子代理失败时停止推进**：如果子代理返回错误、测试未通过、review 未通过，禁止继续下一步，必须将 blocker 写入 `tasks/current.md`。
3. **子代理的上下文隔离**：使用 `isolation: "worktree"` 进行高风险实验性修改，完成后由父代理决定是否合并结果。

### 上下文清理与熔断纪律

- **每完成 1-3 个 tasks 后**，父代理必须主动更新 `tasks/current.md`，并**向用户建议开启新会话继续**，以控制单一会话上下文长度，避免记忆下降和幻觉。
- **总 token 接近上限征兆**（响应明显变慢、出现无关联想）时，立即停止当前工作，保存进度到 `tasks/current.md`，并建议用户开启新会话继续。
- **浏览器测试失败连续 2 次**：停止推进，记录 blocker，等待人工介入。
