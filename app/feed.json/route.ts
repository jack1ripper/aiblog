import { prisma } from "@/lib/prisma";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: { select: { name: true } },
      tags: true,
      category: true,
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "我的博客",
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    language: "zh-CN",
    items: posts.map((post) => ({
      id: `${siteUrl}/posts/${post.slug}`,
      url: `${siteUrl}/posts/${post.slug}`,
      title: post.title,
      content_text: post.excerpt || stripHtml(post.content).slice(0, 500),
      date_published: new Date(post.createdAt).toISOString(),
      author: {
        name: post.author?.name || "Admin",
      },
      tags: post.tags.map((t) => t.name),
    })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
