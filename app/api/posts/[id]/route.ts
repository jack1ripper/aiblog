import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { notifySubscribersOnPublish } from "@/lib/email";

function normalizeStringField(value: unknown, maxLength = 5000): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function normalizeTagNames(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const normalized = input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 40));

  return Array.from(new Set(normalized)).slice(0, 20);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAdmin = !!token && token.role === "admin";
  const authorSelect = isAdmin ? { name: true, email: true } : { name: true };

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      series: true,
      author: { select: authorSelect },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found", errorCode: "POST_404" }, { status: 404 });
  }

  if (!post.published && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, slug: rawSlug, content, excerpt, coverImage, published, pinned, seriesId, seriesOrder, categoryId, tagNames } = body;
  const normalizedTitle = normalizeStringField(title, 180);
  const normalizedContent = normalizeStringField(content, 200_000);
  if (!normalizedTitle || !normalizedContent) {
    return NextResponse.json({ error: "Missing required fields", errorCode: "POST_400" }, { status: 400 });
  }

  const existingPost = await prisma.post.findUnique({ where: { id } });
  if (!existingPost) {
    return NextResponse.json({ error: "Post not found", errorCode: "POST_404" }, { status: 404 });
  }

  const shouldNotify = !existingPost.published && published === true && !existingPost.newsletterSentAt;

  const inputSlug = typeof rawSlug === "string" ? rawSlug.trim() : "";
  let slug = inputSlug || existingPost.slug;
  if (!inputSlug && normalizedTitle !== existingPost.title) {
    slug = generateSlug(normalizedTitle);
    slug = await ensureUniqueSlug(slug, id);
  } else if (inputSlug) {
    const existing = await prisma.post.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists", errorCode: "POST_409" },
        { status: 409 }
      );
    }
  }

  // Rebuild tags: disconnect all then reconnect
  await prisma.post.update({
    where: { id },
    data: {
      tags: {
        set: [],
      },
    },
  });

  const normalizedTagNames = normalizeTagNames(tagNames);
  const connectTags = normalizedTagNames.length
    ? {
        connectOrCreate: normalizedTagNames.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      }
    : undefined;
  const normalizedExcerpt = typeof excerpt === "string" ? excerpt.trim().slice(0, 5000) : null;
  const normalizedCoverImage = typeof coverImage === "string" ? coverImage.trim().slice(0, 2048) : null;
  const normalizedSeriesId = typeof seriesId === "string" && seriesId.trim() ? seriesId.trim() : null;
  const normalizedCategoryId = typeof categoryId === "string" && categoryId.trim() ? categoryId.trim() : null;
  const normalizedPublished = typeof published === "boolean" ? published : existingPost.published;
  const normalizedPinned = typeof pinned === "boolean" ? pinned : existingPost.pinned;
  const normalizedSeriesOrder =
    typeof seriesOrder === "number" && Number.isFinite(seriesOrder)
      ? Math.max(0, Math.trunc(seriesOrder))
      : existingPost.seriesOrder;

  const post = await prisma.post.update({
    where: { id },
    data: {
      title: normalizedTitle,
      slug,
      content: normalizedContent,
      excerpt: normalizedExcerpt,
      coverImage: normalizedCoverImage,
      published: normalizedPublished,
      pinned: normalizedPinned,
      seriesId: normalizedSeriesId,
      seriesOrder: normalizedSeriesOrder,
      categoryId: normalizedCategoryId,
      tags: connectTags,
    },
    include: { category: true, tags: true },
  });

  if (shouldNotify) {
    try {
      const newsletter = await notifySubscribersOnPublish(post);
      return NextResponse.json({ ...post, newsletterSent: true, newsletter });
    } catch {
      return NextResponse.json({ ...post, newsletterSent: false });
    }
  }

  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Post not found", errorCode: "POST_404" }, { status: 404 });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
