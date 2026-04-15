@AGENTS.md

## 自动执行指令

你每次进入本项目时，必须立即执行以下步骤，不需要等待用户输入：

1. 读取 `AGENTS.md` 和 `project-docs/00-index.md`
2. 读取 `tasks/current.md`，找出所有未完成任务
3. 按顺序自动处理这些任务，使用子代理流水线（复杂任务先创建 Plan agent）
4. 每完成一个 task：
   - 自动运行构建（`npm run build`）
   - 前端改动必须通过 Chrome DevTools MCP 进行浏览器验证
   - 自动 `git commit` 并 `git push`
   - 更新 `tasks/current.md`
5. 完成后调用 `ScheduleWakeup` 继续下一个 task
6. 遇到 blocker（构建失败、测试未通过、需求不明确、子代理异常）时停止，并将 blocker 记录到 `tasks/current.md`
7. 全程不需要用户确认，除非触及 AGENTS.md 中的质量门禁
