import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { ensureUniqueSlug } from "@/lib/slug";
import { importPostFromUrl } from "@/lib/url-import";

type ImportMode = "preview" | "import";

function normalizeTagNames(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const normalized = input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 40));

  return Array.from(new Set(normalized)).slice(0, 20);
}

function normalizeStringField(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function markdownToExcerpt(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_`\-\[\]()!>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

async function findDuplicate(sourceUrl: string, title: string) {
  const duplicatedBySource = await prisma.post.findUnique({
    where: { sourceUrl },
    select: { id: true, title: true, slug: true, sourceUrl: true },
  });

  if (duplicatedBySource) {
    return {
      reason: "sourceUrl" as const,
      post: duplicatedBySource,
    };
  }

  const duplicatedByTitle = await prisma.post.findFirst({
    where: { title },
    select: { id: true, title: true, slug: true, sourceUrl: true },
  });

  if (duplicatedByTitle) {
    return {
      reason: "title" as const,
      post: duplicatedByTitle,
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const body = await req.json();
  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  const mode: ImportMode = body.mode === "preview" ? "preview" : "import";

  if (!rawUrl) {
    return NextResponse.json({ error: "请先输入博客链接", errorCode: "IMPORT_400" }, { status: 400 });
  }

  try {
    const imported = await importPostFromUrl(rawUrl);
    const duplicate = await findDuplicate(imported.sourceUrl, imported.title);

    if (mode === "preview") {
      return NextResponse.json({
        preview: {
          sourceUrl: imported.sourceUrl,
          sourceHost: imported.sourceHost,
          title: imported.title,
          excerpt: imported.excerpt,
          coverImage: imported.coverImage,
          content: imported.content,
          tagNames: imported.tagNames,
          quality: imported.quality,
        },
        duplicate,
      });
    }

    if (duplicate?.reason === "sourceUrl" && body.forceImport !== true) {
      return NextResponse.json(
        {
          error: "该原文链接已导入过，默认阻止重复导入",
          errorCode: "IMPORT_409",
          duplicate,
        },
        { status: 409 }
      );
    }

    const customTitle = normalizeStringField(body.title, 180);
    const customExcerpt = normalizeStringField(body.excerpt, 5000);
    const customCoverImage = normalizeStringField(body.coverImage, 2048);
    const customContent = typeof body.content === "string" ? body.content.trim() : "";

    const title = customTitle || imported.title.slice(0, 180);
    const content = customContent || imported.content;
    const excerpt = customExcerpt || imported.excerpt || markdownToExcerpt(content);
    const coverImage = customCoverImage || imported.coverImage;

    if (!title || content.length < 120) {
      return NextResponse.json(
        {
          error: "标题或正文无效，请在预览区补充后再导入",
          errorCode: "IMPORT_422",
        },
        { status: 422 }
      );
    }

    const slug = await ensureUniqueSlug(imported.slugBase || `import-${Date.now()}`);
    const categoryNameRaw = normalizeStringField(body.categoryName, 40);
    const categoryName = categoryNameRaw || "转载";

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    const customTags = normalizeTagNames(body.tagNames);
    const mergedTags = Array.from(new Set([...imported.tagNames, ...customTags])).slice(0, 20);

    const sourceCitation = `原文链接：[${imported.sourceHost}](${imported.sourceUrl})`;
    const finalContent = content.includes(imported.sourceUrl)
      ? content
      : `${content}\n\n---\n\n${sourceCitation}`;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        sourceUrl: imported.sourceUrl,
        sourceHost: imported.sourceHost,
        excerpt: excerpt ? excerpt.slice(0, 5000) : null,
        coverImage: coverImage || null,
        content: finalContent,
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
        quality: imported.quality,
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
