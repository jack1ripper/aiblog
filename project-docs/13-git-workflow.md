# Git 工作流

## 分支

- `main`：可部署代码
- `feature/<task-id>-描述`：功能
- `bugfix/<task-id>-描述`：修复
- `hotfix/描述`：紧急修复

## 提交规范（Conventional Commits）

```
type(scope): subject

body
```

类型：`feat` `fix` `docs` `style` `refactor` `perf` `test` `chore`

## 纪律

- **禁止**在 `main` 直接开发
- 每个 task 独立分支
- commit 粒度小，message 清晰
- 禁止无意义 message：`update`、`fix`、`1`
- 合并前必须通过 code review + CI
