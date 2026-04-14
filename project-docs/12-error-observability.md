# 错误处理与可观测性

## 前端

- 全局错误边界 + `window.onerror` / `unhandledrejection`
- 用户操作失败必须有明确提示（toast / modal / inline）
- **禁止** UI 直接显示原始堆栈

## 后端

- 异常在边界层捕获
- 业务错误返 4xx + 错误码
- 系统错误返 500，记录日志，前端只显示"服务异常"

## 日志

- 级别：DEBUG / INFO / WARN / ERROR
- 禁止打印敏感信息
- 推荐 JSON 结构化日志：timestamp / level / traceId / message / errorCode

## 禁止

- `try { ... } catch (e) { }` 静默吞异常
- `console.log(error)` 代替错误上报
- 数据库原始错误直接返前端
- `throw 'string'`

## 可观测性

- Metrics：QPS、P95、错误率
- 分布式追踪：OpenTelemetry / traceId
- 健康检查：`/health`
