import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ensureUniqueSlug } from "../lib/slug";
import { importPostFromUrl } from "../lib/url-import";

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const url = args.find((item) => !item.startsWith("--")) || "";

  const publish = args.includes("--publish");
  const categoryArg = args.find((item) => item.startsWith("--category="));
  const tagsArg = args.find((item) => item.startsWith("--tags="));

  const categoryName = categoryArg ? categoryArg.split("=").slice(1).join("=").trim() : "";
  const tagNames = tagsArg
    ? tagsArg
        .split("=")
        .slice(1)
        .join("=")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return { url, publish, categoryName, tagNames };
}

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
  const { url, publish, categoryName, tagNames } = parseArgs(process.argv);

  if (!url) {
    console.error("用法: npx tsx scripts/import-post-from-url.ts <博客URL> [--publish] [--category=分类] [--tags=标签1,标签2]");
    process.exit(1);
  }

  const imported = await importPostFromUrl(url);
  const admin = await ensureAdminUser();

  const category = await prisma.category.upsert({
    where: { name: (categoryName || "转载").slice(0, 40) },
    update: {},
    create: { name: (categoryName || "转载").slice(0, 40) },
  });

  const mergedTags = Array.from(new Set([...imported.tagNames, ...tagNames]))
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((name) => name.slice(0, 40));

  const post = await prisma.post.create({
    data: {
      title: imported.title.slice(0, 180),
      slug: await ensureUniqueSlug(imported.slugBase || `import-${Date.now()}`),
      sourceUrl: imported.sourceUrl,
      sourceHost: imported.sourceHost,
      excerpt: imported.excerpt ? imported.excerpt.slice(0, 5000) : null,
      coverImage: imported.coverImage || null,
      content: `${imported.content}\n\n---\n\n原文链接：[${imported.sourceHost}](${imported.sourceUrl})`,
      published: publish,
      authorId: admin.id,
      categoryId: category.id,
      tags: mergedTags.length
        ? {
            connectOrCreate: mergedTags.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
    },
  });

  console.log("导入成功:");
  console.log(`- 标题: ${post.title}`);
  console.log(`- Slug: ${post.slug}`);
  console.log(`- 状态: ${post.published ? "已发布" : "草稿"}`);
  console.log(`- 编辑: /jack/posts/${post.id}/edit`);
}

main()
  .catch((error) => {
    console.error("导入失败:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
