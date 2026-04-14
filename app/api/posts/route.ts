import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session = await getServerSession(authOptions);
  const isAdmin = !!session && (session.user as { role?: string }).role === "admin";

  const publishedOnly = !isAdmin || searchParams.get("published") !== "false";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const where = publishedOnly ? { published: true } : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const body = await req.json();
  const { title, slug, content, excerpt, coverImage, published, categoryId, tagNames } = body;

  if (!title || !slug || !content) {
    return NextResponse.json({ error: "Missing required fields", errorCode: "POST_400" }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists", errorCode: "POST_409" }, { status: 409 });
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
      authorId: (session.user as { id: string }).id,
      categoryId: categoryId || null,
      tags: connectTags,
    },
    include: { category: true, tags: true },
  });

  return NextResponse.json(post, { status: 201 });
}
