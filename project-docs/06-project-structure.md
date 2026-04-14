# 项目结构

## 目录结构

```
src/
├── components/   # 可复用组件
├── pages/        # 页面
├── services/     # 业务逻辑
├── utils/        # 工具函数
├── types/        # 类型定义
└── assets/       # 静态资源
tests/
├── unit/
├── integration/
└── e2e/
```

## 命名规范

- 文件：kebab-case（`user-profile.tsx`）
- 组件：PascalCase（`UserProfile`）
- 变量/函数：camelCase（`getUserInfo`）
- 常量：UPPER_SNAKE_CASE
- 类型：PascalCase

## 原则

- 就近原则放测试
- 一个文件一个主要职责
- 目录层级 ≤ 4
