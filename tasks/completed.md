# 已完成任务清单

## 二期

### TASK-101: 文章目录 TOC
- 文章详情页右侧增加悬浮目录（≥1280px 显示），支持点击平滑滚动、IntersectionObserver 高亮当前章节。

### TASK-102: 代码块复制按钮
- 改造 `MarkdownRenderer`，在代码块右上角增加「复制」按钮，点击后显示「已复制」状态 2 秒。

### TASK-103: Giscus 评论系统
- 文章页底部接入 Giscus 评论组件。未配置环境变量时显示友好提示块。

### TASK-104: 关于页 / 友链页 / 归档页
- `about`：个人简介与联系方式
- `friends`：友情链接卡片列表
- `archive`：按年份分组的文章时间轴

### TASK-105: 阅读时间 + 上下篇导航 + 阅读量统计
- 文章页顶部显示阅读时间（按 500 字/分钟估算）
- 文章底部增加「上一篇 / 下一篇」导航卡片
- 每次访问文章自动 `views + 1`

### TASK-106: 导航栏与 404 页面
- Header 增加「归档、友链、关于」入口；新增中文 404 页面。

### TASK-107: 首页纯文字列表改版
- 移除 PostCard 封面图，改为单列纯文字列表布局。

### TASK-108: Slug 自动生成（拼音混合）
- 引入 `pinyin-pro`，根据标题自动生成拼音混合 slug；API 层自动去重。

## 三期

### TASK-201: 头像系统（Avatar）
- 后台上传头像，Gravatar fallback，作者简介卡片。

### TASK-202: 站点通知系统（Site Notifications）
- 全局 Banner + Markdown `:::note` / `:::warning` / `:::tip` Callout。

### TASK-203: RSS 订阅增强
- 补全 `/feed.xml` 与 `/feed.json`。

### TASK-204: 文章搜索（全文 + 快捷键）
- `Cmd/Ctrl + K` 搜索模态框，Prisma `contains` 模糊查询。

### TASK-205: 文章系列 / 专栏（Series）
- `Series` 模型，文章页系列导航。

### TASK-206: OpenGraph 动态图生成
- `/api/og` 动态生成 1200×630 分享图。

### TASK-207: 置顶文章（Pinned Post）
- `pinned` 字段，首页置顶排序与徽标。

### TASK-208: Newsletter / 邮件订阅
- `Subscriber` 模型，Footer 订阅框，后台订阅者管理。

### TASK-209: Markdown 剪贴板直接粘贴上传
- 编辑器 `Ctrl+V` 图片上传。

### TASK-210: 文章自动保存草稿
- `localStorage` 自动保存与恢复草稿。

## 四期

### TASK-303: 阅读进度条 + 回到顶部
- 文章页顶部阅读进度条 + 右下角回到顶部按钮。

### TASK-305: 站点访问统计 Dashboard（管理员）
- `PageView` 模型，`/admin/dashboard` 数据看板。
