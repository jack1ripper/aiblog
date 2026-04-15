import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { notifySubscribersOnPublish } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAdmin = !!token && token.role === "admin";

  const publishedOnly = !isAdmin || searchParams.get("published") !== "false";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const where = publishedOnly ? { published: true } : {};

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
        author: { select: { name: true, email: true } },
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
  const { title, slug: rawSlug, content, excerpt, coverImage, published, pinned, seriesId, seriesOrder, categoryId, tagNames } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Missing required fields", errorCode: "POST_400" }, { status: 400 });
  }

  let slug = rawSlug?.trim();
  if (!slug) {
    slug = generateSlug(title);
    slug = await ensureUniqueSlug(slug);
  } else {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists", errorCode: "POST_409" }, { status: 409 });
    }
  }

  const connectTags = tagNames?.length
    ? {
        connectOrCreate: tagNames.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      }
    : undefined;

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      published: published ?? false,
      pinned: pinned ?? false,
      seriesId: seriesId || null,
      seriesOrder: seriesOrder ?? 0,
      authorId: token.sub as string,
      categoryId: categoryId || null,
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
