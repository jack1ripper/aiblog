import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

type CuratedPost = {
  title: string;
  slug: string;
  excerpt: string;
  createdAt: string;
  category: string;
  tags: string[];
  content: string;
};

const curatedPosts: CuratedPost[] = [
  {
    title: "2021 前端经验：用 aspect-ratio 解决图片与卡片布局抖动",
    slug: "frontend-2021-aspect-ratio-layout-stability",
    excerpt:
      "基于 web.dev 的高质量实践整理，复盘如何通过 aspect-ratio 降低 CLS、稳定首屏骨架和内容卡片体验。",
    createdAt: "2021-06-18T09:00:00.000Z",
    category: "前端工程",
    tags: ["CSS", "性能优化", "布局稳定性"],
    content: `## 为什么这篇值得放进博客时间线

这篇内容整理自 web.dev 的经典文章《The CSS aspect-ratio property》。它不是“新技术炫技”，而是长期有效的工程经验：在真实页面里，图片和卡片的尺寸不确定，最容易触发布局抖动（CLS）。

## 我们在项目里的常见问题

1. 列表卡片首屏先渲染文本，图片后加载，整块内容下移。
2. 封面图尺寸不统一，导致瀑布流/网格断层。
3. 骨架屏高度和真实内容高度不一致，视觉“跳一下”。

## 可直接落地的方案

\`\`\`css
.post-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}
\`\`\`

关键点不是“会写属性”，而是先把设计系统里的媒体比例约定清楚，比如封面统一 \`16/9\`，头像统一 \`1/1\`，长图统一 \`3/4\`。

## 实战建议

1. 在组件层封装比例，而不是每个页面手写。
2. 骨架屏使用同一比例变量，避免加载后跳动。
3. 配合 \`width\`/\`height\` 或容器占位策略一起用，移动端体验更稳。

## 参考来源

- web.dev: https://web.dev/articles/aspect-ratio`,
  },
  {
    title: "2022 架构拐点：React 18 并发渲染该怎么真正用起来",
    slug: "react-18-concurrency-practical-notes-2022",
    excerpt:
      "基于 React 官方发布说明的实战解读，聚焦 startTransition、流式 SSR 与渐进升级策略，避免“升级了但没收益”。",
    createdAt: "2022-04-08T09:00:00.000Z",
    category: "React",
    tags: ["React", "并发渲染", "SSR"],
    content: `## 背景

React 18 的价值不在于“版本号更新”，而在于它把渲染优先级管理能力开放给了业务。官方发布文是高质量基线，但很多团队升级后仍然沿用旧写法。

## 这次升级真正改变了什么

1. \`startTransition\`：把非紧急更新降权，输入和点击保持顺滑。
2. \`Suspense\` + 流式 SSR：首屏先到、细节后到，降低等待感。
3. 新根 API：为并发能力提供一致入口。

## 一个可复用的判断准则

当你要更新“不会影响当前手势反馈”的内容时，优先考虑 transition。例如搜索页里，输入框字符回显是高优先级，结果列表刷新是可延后的。

## 渐进式落地路线

1. 先升级框架版本并替换 root API。
2. 选一两个高交互页面试点 transition。
3. 监控输入延迟、交互卡顿和错误日志，再扩大范围。

## 参考来源

- React 官方博客: https://react.dev/blog/2022/03/29/react-v18`,
  },
  {
    title: "2023 经验复盘：Next.js 13.4 App Router 稳定后该怎么迁移",
    slug: "nextjs-13-4-app-router-migration-2023",
    excerpt:
      "基于 Next.js 官方 13.4 发布内容，整理一套从 Pages Router 迁移到 App Router 的风险清单与落地路径。",
    createdAt: "2023-06-02T09:00:00.000Z",
    category: "Next.js",
    tags: ["Next.js", "App Router", "工程实践"],
    content: `## 为什么这是一篇“工程向”高质量来源

Next.js 13.4 标志着 App Router 进入稳定阶段，官方文档和发布说明给出了架构方向，但团队落地时仍需要迁移策略。

## 迁移时最容易踩坑的点

1. 目录迁移后，数据获取职责边界不清。
2. Client Component 过度上浮，导致包体积反弹。
3. 缓存策略默认值理解偏差，引发“数据怎么不更新”。

## 建议的迁移顺序

1. 先迁移低风险页面，建立路由与布局范式。
2. 把交互组件压到叶子节点，默认走 Server Component。
3. 对关键接口显式声明缓存策略，避免隐式行为。

## 结果导向指标

- 首屏 HTML 到达时间
- 客户端 JS 体积变化
- 线上错误率与回滚次数

## 参考来源

- Next.js 官方博客: https://nextjs.org/blog/next-13-4`,
  },
  {
    title: "2024 前沿性能：INP 成为 Core Web Vitals 后的优化优先级",
    slug: "inp-core-web-vitals-priority-2024",
    excerpt:
      "基于 web.dev 官方更新，梳理 INP 成为核心指标后的排查链路：长任务、事件处理、渲染阻塞与拆分策略。",
    createdAt: "2024-03-20T09:00:00.000Z",
    category: "性能优化",
    tags: ["Web Vitals", "INP", "前端性能"],
    content: `## 变化点

从 2024 年开始，INP（Interaction to Next Paint）成为 Core Web Vitals 的核心指标之一。它关注的是交互响应全链路，而不是只看首屏。

## 为什么很多站点“体感慢”却难以定位

1. 监控只看 FCP/LCP，忽略交互阶段。
2. 事件回调里塞入了同步重计算逻辑。
3. 主线程长任务没有切片，用户操作被排队。

## 一条可执行的排查流程

1. 先定位高频交互（搜索、筛选、Tab、弹窗）。
2. 用性能面板找到触发后的长任务区间。
3. 把大计算拆分、延后或转移优先级。
4. 复测真实设备，确认响应抖动下降。

## 给内容型博客的启发

博客并非“天然轻量”。目录展开、搜索建议、评论加载、阅读进度监听都可能影响交互响应。把交互链路做薄，用户会明显感知到更跟手。

## 参考来源

- web.dev 博客: https://web.dev/blog/inp-cwv`,
  },
  {
    title: "2025 最新前沿：React Compiler 1.0 对组件写法的真实影响",
    slug: "react-compiler-1-frontend-patterns-2025",
    excerpt:
      "基于 React 官方 React Compiler 1.0 发布内容，讨论“自动优化时代”下组件边界、状态建模与可维护性的取舍。",
    createdAt: "2025-10-20T09:00:00.000Z",
    category: "前沿技术",
    tags: ["React", "React Compiler", "代码质量"],
    content: `## 为什么要关注这个节点

React Compiler 1.0 代表前端性能优化从“手动技巧”转向“编译阶段自动优化”。这不是让我们停止思考，而是把精力从微观优化转移到更高价值的建模问题。

## 常见误区

1. 以为有了编译器就不需要关心组件边界。
2. 继续堆叠复杂副作用，期待工具自动兜底。
3. 忽视数据流可读性，导致团队协作成本上升。

## 更值得坚持的工程原则

1. 单向数据流保持清晰，减少隐式耦合。
2. 状态尽量贴近使用点，避免全局污染。
3. 组件职责单一，让编译优化更可预测。

## 给博客系统开发的启发

后台编辑器、预览区、筛选检索这类高交互页面，会直接受益于更稳定的渲染性能。但可维护性永远先于“看起来更聪明”的写法。

## 参考来源

- React 官方博客: https://react.dev/blog/2025/10/07/react-compiler-1`,
  },
];

async function ensureAdminUser() {
  const existingAdmin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (existingAdmin) return existingAdmin;

  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      name: "Admin",
      role: "admin",
      password: hashedPassword,
    },
  });
}

async function main() {
  const admin = await ensureAdminUser();

  await prisma.post.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});

  for (const item of curatedPosts) {
    const category = await prisma.category.upsert({
      where: { name: item.category },
      update: {},
      create: { name: item.category },
    });

    const tags = await Promise.all(
      item.tags.map((name) =>
        prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );

    await prisma.post.create({
      data: {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.content,
        published: true,
        createdAt: new Date(item.createdAt),
        authorId: admin.id,
        categoryId: category.id,
        tags: {
          connect: tags.map((tag) => ({ id: tag.id })),
        },
      },
    });
  }

  const total = await prisma.post.count();
  console.log(`Imported ${total} curated posts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
