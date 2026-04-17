import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q")?.trim() || "").slice(0, 100);

  if (!q) {
    return NextResponse.json({ posts: [] });
  }

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: q } },
        { excerpt: { contains: q } },
        { content: { contains: q } },
        { tags: { some: { name: { contains: q } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { category: true, tags: true },
    take: 20,
  });

  return NextResponse.json({ posts });
}
