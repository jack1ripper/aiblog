# API 规范

## 风格

RESTful：资源用名词复数，`/users`、`/orders`
- GET：读，POST：建，PUT/PATCH：改，DELETE：删
- **禁止** URL 用动词，如 `/getUsers`

## 请求

- 认证：`Authorization: Bearer <token>`
- 类型：`application/json`
- 4xx 必须指明具体字段

## 响应格式

```json
{
  "data": { ... },
  "meta": { "requestId": "uuid" }
}
```

错误：
```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "...",
    "field": "email",
    "requestId": "uuid"
  }
}
```

## 状态码

| 码 | 场景 |
|----|------|
| 200 | GET/PUT/PATCH 成功 |
| 201 | POST 成功 |
| 204 | DELETE 成功 |
| 400 | 参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突 |
| 422 | 业务规则失败 |
| 429 | 限流 |
| 500 | 服务器错误 |

## 安全

- GET/PUT/DELETE 幂等
- 禁止响应返回密码、密钥、未脱敏敏感信息
- 输入必须校验和转义
