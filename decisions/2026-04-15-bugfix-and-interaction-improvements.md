# 2026-04-15 Bugfix 与交互改进决策

## 背景

在首轮开发后，通过实际使用和测试发现以下问题：默认页面路由冲突、API 缺少输入校验、前端存在静默失败、以及若干可改进的交互细节。

## 决策

### 1. 路由修复：彻底移除 `app/page.tsx`

**问题**：Next.js 初始化生成的 `app/page.tsx` 优先级高于 `app/(blog)/page.tsx`，导致首页始终显示 Vercel 默认欢迎页而非文章列表。

**决策**：直接删除 `app/page.tsx`，并清理 `.next` 缓存后重启 dev server。

### 2. 上传接口增加安全边界

**问题**：`POST /api/upload` 未校验文件类型和大小，可上传任意文件。

**决策**：
- 仅允许 `image/*` MIME 类型
- 限制单个文件最大 5MB
- 文件名做安全清洗（替换路径分隔符和特殊字符）
- 错误响应统一为 `{ error, errorCode }` 格式，返回 4xx 状态码

### 3. 错误处理与用户提示

**问题**：多处 `fetch` 失败被静默吞掉，用户无感知。

**决策**：
- 禁止空 catch，所有网络请求增加 `try/catch` 或 `.catch`
- 后台列表加载失败渲染 `Alert` 组件
- 删除失败使用原生 `alert()` 明确告知（后台场景下可接受）
- 表单提交/上传失败使用 `Alert` 显示具体错误信息

### 4. 交互体验改进

**问题**：
- 后台缺少退出登录入口
- 文章卡片使用原生 `<img>`，缺少占位和优化
- Loading 状态是纯文字 "Loading..."
- Markdown 编辑器在暗黑模式下白底刺眼
- 编辑文章时标题修改会覆盖用户手动调整过的 slug

**决策**：
- 在 `AdminLayout` 侧边栏底部增加 Sign Out 按钮（POST 到 `/api/auth/signout`）
- `PostCard` 改用 `next/image`（配合 `unoptimized: true`），无封面显示 `bg-muted` 占位块
- `AdminPostsPage` Loading 使用 Skeleton 骨架屏
- 在 `globals.css` 中为 `.dark .markdown-editor` 增加 easymde 的暗黑覆盖样式
- `PostForm` 引入 `slugTouched` ref，记录用户是否手动编辑过 slug，避免自动覆盖

### 5. API 健壮性

**问题**：`PUT /api/posts/[id]` 直接调用 `prisma.post.update`，若 ID 不存在会抛出 500 级 Prisma 异常。

**决策**：
- 所有更新/删除操作前先用 `findUnique` 检查资源存在性
- 不存在时返回 `404` + 结构化错误体 `{ error: "Post not found", errorCode: "POST_404" }`
- 统一全站 API 错误格式

## 影响

- 无新增外部依赖
- 不改变数据库 Schema
- 不引入破坏性接口变更（仅增强错误响应体字段）
