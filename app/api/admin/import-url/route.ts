import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { ensureUniqueSlug } from "@/lib/slug";
import { importPostFromUrl } from "@/lib/url-import";

function normalizeTagNames(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const normalized = input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 40));

  return Array.from(new Set(normalized)).slice(0, 20);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const body = await req.json();
  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";

  if (!rawUrl) {
    return NextResponse.json({ error: "请先输入博客链接", errorCode: "IMPORT_400" }, { status: 400 });
  }

  try {
    const imported = await importPostFromUrl(rawUrl);
    const slug = await ensureUniqueSlug(imported.slugBase || `import-${Date.now()}`);

    const categoryNameRaw = typeof body.categoryName === "string" ? body.categoryName.trim() : "";
    const categoryName = (categoryNameRaw || "转载").slice(0, 40);
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    const customTags = normalizeTagNames(body.tagNames);
    const mergedTags = Array.from(new Set([...imported.tagNames, ...customTags])).slice(0, 20);

    const post = await prisma.post.create({
      data: {
        title: imported.title.slice(0, 180),
        slug,
        excerpt: imported.excerpt ? imported.excerpt.slice(0, 5000) : null,
        coverImage: imported.coverImage || null,
        content: `${imported.content}\n\n---\n\n原文链接：[${imported.sourceHost}](${imported.sourceUrl})`,
        published: body.published === true,
        authorId: token.sub as string,
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
      include: { tags: true, category: true },
    });

    return NextResponse.json(
      {
        id: post.id,
        title: post.title,
        slug: post.slug,
        published: post.published,
        editPath: `/jack/posts/${post.id}/edit`,
        previewPath: `/posts/${post.slug}`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "导入失败";
    return NextResponse.json({ error: message, errorCode: "IMPORT_500" }, { status: 500 });
  }
}
