# My Blog

一个基于 Next.js 全栈一体化的个人博客系统，支持后台文章管理、Markdown 编辑、标签分类、全文搜索、RSS 订阅和暗黑模式。

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19 + TypeScript
- **样式**: Tailwind CSS 4 + shadcn/ui
- **ORM**: Prisma 5 + SQLite
- **认证**: NextAuth.js v4 (Credentials Provider)
- **编辑器**: react-simplemde-editor (Markdown)
- **渲染**: react-markdown + react-syntax-highlighter

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库（已包含在项目中，SQLite 零配置）
npx prisma migrate deploy

# 3. 创建默认管理员账号
npx tsx scripts/seed.ts
# 默认账号: admin@example.com / admin123

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看前台，访问 http://localhost:3000/admin/posts 进入后台管理。

## 功能特性

### 前台（读者端）
- 首页文章列表（支持分类、标签、封面图）
- 文章详情页（Markdown 渲染、代码高亮）
- 按标签 / 分类筛选文章
- 全文搜索（标题、摘要、内容）
- RSS 订阅 (`/feed.xml`)
- SEO 优化（Sitemap、OpenGraph、动态 Meta）
- 响应式布局 + 系统级暗黑模式

### 后台（管理端）
- 管理员登录（基于 NextAuth）
- 文章的增删改查（CRUD）
- Markdown 实时预览编辑器
- 封面图本地上传
- 标签、分类管理
- 草稿 / 发布状态切换

## 目录结构

```
app/
  (blog)/           # 前台路由组
    page.tsx        # 首页
    posts/[slug]/   # 文章详情
    tags/[name]/    # 标签筛选
    categories/[name]/  # 分类筛选
    search/         # 搜索页
  admin/            # 后台路由组
    login/          # 登录页
    posts/          # 文章列表
    posts/new/      # 新建文章
    posts/[id]/edit/# 编辑文章
  api/              # API 路由
    auth/           # NextAuth 接口
    posts/          # 文章 CRUD
    upload/         # 图片上传
    feed.xml/       # RSS Feed
components/         # React 组件
lib/                # 工具函数（Prisma、Auth）
prisma/             # 数据库 Schema 和迁移
scripts/            # 种子脚本
```

## 部署建议

**推荐平台**: Vercel
1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 设置环境变量 `NEXTAUTH_SECRET`（生产环境必须设置强密码）
4. 数据库可迁移至 PostgreSQL（修改 `prisma/schema.prisma` 的 provider 为 `postgresql`）

**环境变量示例**:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-production-secret"
NEXT_PUBLIC_SITE_URL="https://your-domain.vercel.app"
```

## 后续可扩展

- [ ] 接入 Giscus 评论系统
- [ ] 文章阅读量统计
- [ ] 邮件订阅功能
- [ ] ISR 增量静态再生成
- [ ] 图片 CDN（Cloudinary / Vercel Blob）
