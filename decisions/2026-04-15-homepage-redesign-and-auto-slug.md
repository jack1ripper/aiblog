# 2026-04-15 首页改版与 Slug 自动生成

## 背景

用户反馈首页大量文章未上传封面图，导致默认显示灰底，视觉效果较差；同时后台新增文章时手动填写 Slug 步骤冗余。

## 决策

### 1. 首页改为纯文字列表

- **移除 `PostCard` 中的封面图**，避免无图文章出现灰底。
- 采用**单列居中**布局（`max-w-3xl`），卡片之间以 `divide-border` 分隔。
- 设计强调：大标题、2 行摘要、横排元信息（日期 · 阅读量 · 分类），标题 hover 变色。

### 2. Slug 自动生成（拼音混合策略）

- **引入 `pinyin-pro`** 进行中文转拼音。
- 算法规则：
  - 中文字符 → 无声调拼音
  - 英文字母 / 数字 → 保留原样
  - 其他字符 → 替换为空格
  - 最终统一为小写、空格变 `-`、去首尾 `-`、截断 100 字符
- **唯一性处理**：若生成的 slug 已存在，尾部自动递增 `-2`、`-3`… 直至唯一。
- **后台表单**：移除 Slug 手动输入框，改为只读展示；标题输入时前端实时预览生成的 slug。
- **API 兜底**：`POST /api/posts` 与 `PUT /api/posts/[id]` 在 `slug` 为空时自动调用生成逻辑，不影响已有文章 URL。

## 影响范围

- `components/post-card.tsx`
- `app/(blog)/page.tsx`
- `lib/slugify.ts`（新建）
- `lib/slug.ts`（新建）
- `app/api/posts/route.ts`
- `app/api/posts/[id]/route.ts`
- `components/post-form.tsx`
- `package.json`（新增 `pinyin-pro`）
