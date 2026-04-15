import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [totalPosts, totalViews, trendRaw, topPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.$queryRaw`
      SELECT strftime('%Y-%m-%d', viewedAt / 1000, 'unixepoch') as date, COUNT(id) as count
      FROM PageView
      WHERE datetime(viewedAt / 1000, 'unixepoch') >= ${sevenDaysAgoStr}
      GROUP BY date
      ORDER BY date ASC
    ` as Promise<{ date: string; count: number }[]>,
    prisma.post.findMany({
      where: { published: true },
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, views: true },
    }),
  ]);

  // 补齐没有数据的日期
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days[key] = 0;
  }

  for (const item of trendRaw) {
    if (days[item.date] !== undefined) {
      days[item.date] = Number(item.count);
    }
  }

  const trend = Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const maxTrend = Math.max(...trend.map((t) => t.count), 1);

  return NextResponse.json({
    totalPosts,
    totalViews: totalViews._sum.views || 0,
    trend,
    maxTrend,
    topPosts,
  });
}
