import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const IMPORT_DIR = path.join(process.cwd(), "posts", "import");
const IMPORTED_DIR = path.join(process.cwd(), "posts", "imported");

interface FrontMatter {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  createdAt?: string;
  published?: boolean;
}

function parseFrontMatter(raw: string): { data: FrontMatter; content: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    throw new Error("文件缺少 YAML Front Matter（必须以 --- 开头）");
  }

  const yamlBlock = match[1];
  const content = match[2].trim();
  const data = {} as Record<string, any>;

  for (const line of yamlBlock.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value: any = line.slice(idx + 1).trim();

    // 去除引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // 解析数组，如 ["a", "b"] 或 ['a', 'b'] 或 [a, b]
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1);
      value = inner
        .split(",")
        .map((v: string) => {
          const s = v.trim();
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.slice(1, -1);
          }
          return s;
        })
        .filter(Boolean);
    }

    // 解析布尔值
    if (value === "true") value = true;
    if (value === "false") value = false;

    data[key] = value;
  }

  return { data: data as FrontMatter, content };
}

async function ensureAdmin() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (admin) return admin;

  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      name: "Admin",
      role: "admin",
      password: passwordHash,
    },
  });
}

async function importFile(filePath: string, adminId: string): Promise<boolean> {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = parseFrontMatter(raw);

  // 必填校验
  if (!data.title) throw new Error("缺少 title");
  if (!data.slug) throw new Error("缺少 slug");
  if (!content.trim()) throw new Error("正文内容为空");

  // 检查 slug 是否已存在
  const existing = await prisma.post.findUnique({ where: { slug: data.slug } });
  if (existing) {
    console.log(`  ⚠️ 跳过（已存在）: ${data.slug}`);
    return false;
  }

  // 处理分类
  const categoryName = data.category || "未分类";
  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });

  // 处理标签
  const tagNames = Array.isArray(data.tags) ? data.tags : [];
  const tags = await Promise.all(
    tagNames.map((name: string) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // 处理摘要（为空则取正文前 150 字）
  let excerpt = data.excerpt || "";
  if (!excerpt) {
    excerpt = content
      .replace(/[#*`\[\]!\(\)]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 150);
    if (content.length > 150) excerpt += "…";
  }

  await prisma.post.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt,
      content,
      coverImage: data.coverImage || null,
      published: data.published !== false,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      authorId: adminId,
      categoryId: category.id,
      tags: {
        connect: tags.map((t) => ({ id: t.id })),
      },
    },
  });

  return true;
}

async function main() {
  if (!fs.existsSync(IMPORT_DIR)) {
    console.error(`导入目录不存在: ${IMPORT_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(IMPORTED_DIR)) {
    fs.mkdirSync(IMPORTED_DIR, { recursive: true });
  }

  const files = fs
    .readdirSync(IMPORT_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();

  if (files.length === 0) {
    console.log("posts/import/ 目录下没有待导入的 .md 文件（下划线开头的会被忽略）。");
    return;
  }

  const admin = await ensureAdmin();
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(IMPORT_DIR, file);
    process.stdout.write(`📄 ${file} ... `);

    try {
      const imported = await importFile(filePath, admin.id);
      if (imported) {
        // 导入成功，移动到 imported 目录
        const targetPath = path.join(IMPORTED_DIR, `${Date.now()}-${file}`);
        fs.renameSync(filePath, targetPath);
        console.log("✅ 已导入");
        success++;
      } else {
        skipped++;
      }
    } catch (err: any) {
      console.log(`❌ 失败: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n──────────────`);
  console.log(`总计: ${files.length} 篇`);
  console.log(`成功: ${success} 篇`);
  console.log(`跳过: ${skipped} 篇`);
  console.log(`失败: ${failed} 篇`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
