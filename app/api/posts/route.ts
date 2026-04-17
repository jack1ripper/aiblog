import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { notifySubscribersOnPublish } from "@/lib/email";

const MAX_PAGE_SIZE = 50;

function clampPageSize(input: number, fallback = 10) {
  if (!Number.isFinite(input)) return fallback;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(input)));
}

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAdmin = !!token && token.role === "admin";

  const publishedOnly = !isAdmin || searchParams.get("published") !== "false";
  const pageInput = parseInt(searchParams.get("page") || "1", 10);
  const limitInput = parseInt(searchParams.get("limit") || "10", 10);
  const page = Number.isFinite(pageInput) && pageInput > 0 ? pageInput : 1;
  const limit = clampPageSize(limitInput);
  const skip = (page - 1) * limit;

  const where = publishedOnly ? { published: true } : {};
  const authorSelect = isAdmin ? { name: true, email: true } : { name: true };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [
        { pinned: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
      include: {
        category: true,
        tags: true,
        author: { select: authorSelect },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    slug: rawSlug,
    content,
    excerpt,
    coverImage,
    published,
    pinned,
    seriesId,
    seriesOrder,
    categoryId,
    tagNames,
  } = body;

  const normalizedTitle = normalizeStringField(title, 180);
  const normalizedContent = normalizeStringField(content, 200_000);

  if (!normalizedTitle || !normalizedContent) {
    return NextResponse.json({ error: "Missing required fields", errorCode: "POST_400" }, { status: 400 });
  }

  let slug = typeof rawSlug === "string" ? rawSlug.trim() : "";
  if (!slug) {
    slug = generateSlug(normalizedTitle);
    slug = await ensureUniqueSlug(slug);
  } else {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists", errorCode: "POST_409" }, { status: 409 });
    }
  }

  const normalizedExcerpt = typeof excerpt === "string" ? excerpt.trim().slice(0, 5000) : null;
  const normalizedCoverImage = typeof coverImage === "string" ? coverImage.trim().slice(0, 2048) : null;
  const normalizedSeriesId = typeof seriesId === "string" && seriesId.trim() ? seriesId.trim() : null;
  const normalizedCategoryId = typeof categoryId === "string" && categoryId.trim() ? categoryId.trim() : null;
  const normalizedTagNames = normalizeTagNames(tagNames);
  const normalizedPublished = typeof published === "boolean" ? published : false;
  const normalizedPinned = typeof pinned === "boolean" ? pinned : false;
  const normalizedSeriesOrder =
    typeof seriesOrder === "number" && Number.isFinite(seriesOrder) ? Math.max(0, Math.trunc(seriesOrder)) : 0;
  const connectTags = normalizedTagNames.length
    ? {
        connectOrCreate: normalizedTagNames.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      }
    : undefined;

  const post = await prisma.post.create({
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
      authorId: token.sub as string,
      categoryId: normalizedCategoryId,
      tags: connectTags,
    },
    include: { category: true, tags: true },
  });

  if (post.published && !post.newsletterSentAt) {
    try {
      const newsletter = await notifySubscribersOnPublish(post);
      return NextResponse.json({ ...post, newsletterSent: true, newsletter }, { status: 201 });
    } catch {
      return NextResponse.json({ ...post, newsletterSent: false }, { status: 201 });
    }
  }

  return NextResponse.json(post, { status: 201 });
}
