import { prisma } from "../lib/prisma";

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    console.error("No admin user found. Run scripts/seed.ts first.");
    process.exit(1);
  }

  const existingSlugs = await prisma.post.findMany({
    where: { slug: { in: ["react-server-components-guide", "typescript-tips-2024"] } },
    select: { slug: true },
  });
  const existingSet = new Set(existingSlugs.map((p) => p.slug));

  const categoryTech = await prisma.category.upsert({
    where: { name: "技术" },
    update: {},
    create: { name: "技术" },
  });

  const categoryThinking = await prisma.category.upsert({
    where: { name: "随笔" },
    update: {},
    create: { name: "随笔" },
  });

  const tags = await Promise.all(
    ["React", "Next.js", "TypeScript", "前端工程化", "性能优化"].map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  const tagMap = Object.fromEntries(tags.map((t) => [t.name, t.id]));

  if (!existingSet.has("react-server-components-guide")) {
    await prisma.post.create({
      data: {
        title: "深入理解 React Server Components：从原理到实践",
        slug: "react-server-components-guide",
        content: `## 前言

React Server Components（RSC）自 Next.js 13 App Router 推出以来，已经成为现代 React 开发的核心概念。但很多人对 RSC 的理解仍停留在"在服务端渲染的组件"这一层面。本文将从原理出发，结合实际代码，帮助你真正掌握 RSC。

## 什么是 Server Component？

Server Component 是一种**只在服务端执行**的 React 组件。它不会被发送到客户端，因此：

- **零客户端 bundle 体积**：可以直接在组件中引入大型库（如 markdown 解析器），而不用担心打包体积膨胀
- **直接访问后端资源**：可以无缝连接数据库、文件系统、内部微服务
- **天然支持异步**：可以直接使用 \`await\` 获取数据

\`\`\`tsx
// 这是一个 Server Component，直接在服务端查询数据库
import { prisma } from "@/lib/prisma";

export default async function PostList() {
  const posts = await prisma.post.findMany({ take: 10 });
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
\`\`\`

## Server Component vs SSR

很多人会把 RSC 和传统的 SSR（如 \`getServerSideProps\`）混淆。实际上它们是完全不同的机制：

| 特性 | SSR | RSC |
|------|-----|-----|
| 执行时机 | 每次请求 | 按需 streaming |
| 输出结果 | HTML | React 虚拟 DOM 描述 |
| 客户端 JS | 需要 hydration | 无需 hydration |
| 可交互性 | 完整 | 需配合 Client Component |

## Client Component 的使用场景

虽然 RSC 很强大，但交互性逻辑（如 \`useState\`、\`useEffect\`、事件监听）仍然需要在客户端运行。这时就要用到 **Client Component**：

\`\`\`tsx
"use client";

import { useState } from "react";

export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? "❤️ 已喜欢" : "🤍 喜欢"}
    </button>
  );
}
\`\`\`

## 最佳实践

1. **默认写 Server Component**：只要不需要客户端交互，就写成 Server Component
2. **把 Client Component 往下移**：尽量让叶子节点成为 Client Component，减少客户端 bundle
3. **避免在 Client Component 中 import Server Component**：这会导致整个父树被打包到客户端

## 总结

RSC 不是替代 SSR，而是对 React 组件模型的一次根本性扩展。它让我们能够以组件为粒度，在"服务端"和"客户端"之间自由划分边界，从而构建出更快、更轻量的 Web 应用。`,
        excerpt: "从原理到代码实例，全面解析 React Server Components 的工作机制、与 SSR 的区别，以及如何在 Next.js App Router 中正确使用。",
        published: true,
        authorId: admin.id,
        categoryId: categoryTech.id,
        tags: { connect: [{ id: tagMap["React"] }, { id: tagMap["Next.js"] }] },
      },
    });
    console.log("Created demo post: react-server-components-guide");
  }

  if (!existingSet.has("typescript-tips-2024")) {
    await prisma.post.create({
      data: {
        title: "TypeScript 进阶：10 个提升代码质量的实用技巧",
        slug: "typescript-tips-2024",
        content: `## 为什么你的 TypeScript 还不够"类型安全"

很多团队虽然引入了 TypeScript，但代码里充斥着 \`any\` 和 \`as\`，类型检查形同虚设。今天分享 10 个我在大型前端项目中总结的 TS 进阶技巧，帮你把类型系统真正用起来。

## 1. 用 \`satisfies\` 替代盲目的 \`as\`

\`\`\`ts
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
} satisfies { apiUrl: string; timeout: number };

// config 既保留了具体字面量类型，又通过了结构检查
\`\`\`

\`satisfies\` 的好处是：**检查类型但不变窄**。你既能得到类型安全，又不会丢失自动推断的信息。

## 2. 巧用 \`infer\` 提取泛型参数

\`\`\`ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function fetchUser() {
  return { id: 1, name: "张三" };
}

type User = ReturnType<typeof fetchUser>; // { id: number; name: string }
\`\`\`

## 3. 用 \`strictNullChecks\` 杜绝运行时崩溃

开启 \`"strictNullChecks": true\` 后，\`undefined\` 和 \`null\` 将不能赋值给普通类型：

\`\`\`ts
function greet(name: string) {
  console.log(name.toUpperCase());
}

greet(undefined); // ❌ 编译报错
\`\`\`

这是减少生产环境 \`Cannot read property of undefined\` 最有效的手段。

## 4. 使用 \` branded types \` 防止 ID 混用

\`\`\`ts
type UserId = string & { __brand: "UserId" };
type PostId = string & { __brand: "PostId" };

function getUser(id: UserId) { /* ... */ }

const postId = "123" as PostId;
getUser(postId); // ❌ 类型错误，防止把文章 ID 当作用户 ID 传入
\`\`\`

## 5. 用 \`readonly\` 和 \`ReadonlyArray\` 保证不可变性

\`\`\`ts
interface Props {
  readonly items: ReadonlyArray<string>;
}

// 组件内部无法修改 items，避免副作用
\`\`\`

## 总结

TypeScript 的价值不仅在于"有类型提示"，更在于**在编译期拦截错误**。希望以上技巧能帮你写出更健壮、更可维护的前端代码。欢迎在评论区分享你的 TS 踩坑经验。`,
        excerpt: "10 个大型前端项目验证过的 TypeScript 进阶技巧，涵盖 satisfies、infer、strictNullChecks、branded types 等实战用法。",
        published: true,
        authorId: admin.id,
        categoryId: categoryTech.id,
        tags: { connect: [{ id: tagMap["TypeScript"] }, { id: tagMap["前端工程化"] }] },
      },
    });
    console.log("Created demo post: typescript-tips-2024");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
