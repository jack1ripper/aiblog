# 2026-04-15 二期功能开发决策

## 目标

参考 Ghost、Hugo/PaperMod、Dev.to 等主流博客平台，将项目从"可用"提升到"对外发布的专业博客"水准。

## 已实施功能

### 1. 文章目录（TOC）

**参考**：Hugo PaperMod、Notion 文档、Vercel 文档站
**实现**：
- Client Component `Toc`，在 `useEffect` 中扫描 `article h2/h3`
- 使用 `IntersectionObserver` 实现滚动高亮
- 仅在大屏（`xl:`）右侧悬浮显示，小屏不打扰阅读
- 点击目录项平滑滚动到对应标题（`scrollIntoView({ behavior: "smooth" })`）
- 标题自动注入 `id` 和 `scroll-mt-24`，防止被 fixed header 遮挡

### 2. 代码块复制按钮

**参考**：GitHub、Ghost、Dev.to
**实现**：
- 在 `MarkdownRenderer` 中自定义 `code` renderer
- 检测到 `language-xxx` 类时，在 `SyntaxHighlighter` 外层包 `relative` 容器
- 右上角放置复制按钮，使用 `navigator.clipboard.writeText`
- 按钮带微交互：复制后文字变为「已复制」+ Check 图标，2 秒后恢复
- 按钮样式遵循设计规范：半透明背景、细边框、hover 亮度变化

### 3. Giscus 评论系统

**参考**：几乎所有现代技术博客（Giscus 基于 GitHub Discussions）
**实现**：
- 新建 `GiscusComments` Client Component
- 通过动态注入 `<script src="https://giscus.app/client.js" />` 实现
- 未配置环境变量时显示友好提示，不报错不白屏
- 所需环境变量：
  - `NEXT_PUBLIC_GISCUS_REPO`
  - `NEXT_PUBLIC_GISCUS_REPO_ID`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID`
  - `NEXT_PUBLIC_GISCUS_CATEGORY`（可选，默认 General）

### 4. 关于 / 友链 / 归档

**参考**：中文技术博客标杆（阮一峰、张鑫旭）
**实现**：
- **About**：最大宽度 720px，简洁排版，预留联系方式占位
- **Friends**：卡片式友链列表，hover 时有边框色过渡和轻微阴影
- **Archive**：
  - 按年份分组（`format(createdAt, "yyyy")`）
  - 时间轴样式：左侧年份大标题，右侧为文章列表
  - 文章显示 `MM-dd` 日期 + 标题链接

### 5. 阅读时间 + 上下篇导航 + 阅读量

**参考**：Medium、Ghost
**实现**：
- **阅读时间**：文章页服务端按 `content.length / 500` 计算，最小 1 分钟
- **上下篇导航**：同一查询内用 `prisma.post.findFirst` 取 `createdAt` 相邻的两篇文章
  - 布局为左右两栏卡片，无相邻文章时留白
  - 带 Chevron 图标和 hover 颜色过渡
- **阅读量**：
  - 文章页 `Server Component` 中直接 `prisma.post.update({ views: { increment: 1 } })`
  - 页头显示 `Eye` 图标 + 阅读次数
  - `PostCard` 增加可选 `views` 字段，阅读量 > 0 时显示

### 6. 导航与 404

- Header 增加「归档、友链、关于」链接，移动端 Sheet 菜单同步
- 新增中文 `not-found.tsx`，大字号 404 + 返回首页按钮

## 设计约束

- 无新增外部依赖（Giscus 为 CDN 脚本，无 npm 包）
- 所有交互元素均有过渡动画（`duration-150`、`hover:scale-105`、`hover:shadow-sm`）
- 禁止粗黑边框、五颜六色渐变、胶囊按钮
- 深色模式下的代码主题暂时保持 `vscDarkPlus`（三期可优化为跟随系统切换深浅主题）
