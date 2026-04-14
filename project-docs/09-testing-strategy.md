# 测试策略

## 核心要求

- 新功能优先写测试（TDD）
- 每个 task 必须通过相关测试才能算完成
- 核心业务模块单元覆盖率 ≥ 80%

## 测试金字塔

- 单元测试：大量，覆盖逻辑和边界
- 集成测试：中等，覆盖模块交互和 API
- E2E 测试：少量，覆盖核心用户流程

## 单元测试规范

- 一测一概念
- 名称描述行为：`should reject invalid email`
- 结构：Arrange-Act-Assert
- Mock 外部依赖，不 Mock 被测对象

## 禁止

- 只测 happy path
- 测试依赖私有方法
- Mock 核心业务逻辑
- 写无意义断言（`expect(true).toBe(true)`）
- 共享可变状态
