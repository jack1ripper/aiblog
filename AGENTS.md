# AI 开发规范（AGENTS.md）

## 启动路由（每次新对话必读）

1. 读取 `project-docs/00-index.md`。
2. 按任务类型选择性读取 2-4 个相关文档（不要一次性读完所有 project-docs）。
3. 读取 `tasks/current.md`，确认本次要处理的任务编号和内容。
4. 若需求明确且不触及质量门禁，可直接进入执行；若需求模糊或涉及架构变更，先向用户简要汇报理解再动手。

## 项目特有红线（以下坑已踩过，必须避免）

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

## 质量门禁（触及前必须请示用户）

- 删除/大幅修改核心逻辑
- 引入新的外部依赖
- 测试覆盖率下降
- 需求与实现冲突

## 详细规范

- 通用代码纪律、测试与推送要求、子代理使用规范等详见 `project-docs/14-agent-guidelines.md`。
