import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAdmin = !!token && token.role === "admin";

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      author: { select: { name: true, email: true } },
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
  const { title, slug: rawSlug, content, excerpt, coverImage, published, pinned, categoryId, tagNames } = body;

  const existingPost = await prisma.post.findUnique({ where: { id } });
  if (!existingPost) {
    return NextResponse.json({ error: "Post not found", errorCode: "POST_404" }, { status: 404 });
  }

  let slug = rawSlug?.trim() || existingPost.slug;
  if (!rawSlug?.trim() && title && title !== existingPost.title) {
    slug = generateSlug(title);
    slug = await ensureUniqueSlug(slug, id);
  } else if (rawSlug?.trim()) {
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

  const connectTags = tagNames?.length
    ? {
        connectOrCreate: tagNames.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      }
    : undefined;

  const post = await prisma.post.update({
    where: { id },
    data: {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      published,
      pinned: pinned ?? existingPost.pinned,
      categoryId: categoryId || null,
      tags: connectTags,
    },
    include: { category: true, tags: true },
  });

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
