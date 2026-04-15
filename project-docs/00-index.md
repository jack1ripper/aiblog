# 文档索引与任务路由（必读）

> AI 每次新对话启动时，**先读本文件**，然后根据当前任务类型，**只读对应的相关文档**。

## 第一步：读宪法

- `AGENTS.md`（项目根目录）

## 第二步：按任务类型选择性阅读

| 任务类型 | 必读文档 | 可选文档 |
|---------|---------|---------|
| 新对话启动 / 了解项目 | `01-overview.md`、`02-requirements.md`、`tasks/current.md` | `03-tech-stack.md` |
| 前端页面 / UI 组件 | `08-design-system.md`、`05-user-flow.md` | `03-tech-stack.md` |
| API 接口 / 后端接口 | `10-api-design.md`、`04-architecture.md` | `02-requirements.md` |
| 写测试 / 跑测试 | `09-testing-strategy.md` | — |
| 性能优化 | `11-performance.md` | — |
| 错误处理 / 日志 / 监控 | `12-error-observability.md` | — |
| 新功能开发（通用） | `02-requirements.md`、`03-tech-stack.md`、`04-architecture.md`、`tasks/current.md` | `05-user-flow.md` |
| 提交代码 / 分支管理 | `13-git-workflow.md` | — |
| 自治循环 / 多代理编排 | `14-autonomous-loop.md` | `AGENTS.md`、`WORKFLOW.md` |

## 第三步：确认任务

阅读完相关文档后，查看 `tasks/current.md`，确认本次要处理的具体任务编号和内容。

## 加载纪律

- **禁止一次性读取全部 project-docs 文档**（除非用户明确要求全面 review）
- 只读取与当前任务**直接相关**的 2-4 个文档
- 不确定该读哪个时，主动询问用户确认
