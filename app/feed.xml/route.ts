import { prisma } from "@/lib/prisma";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: { select: { name: true, email: true } },
      tags: true,
      category: true,
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const authorName = posts[0]?.author?.name || "Admin";

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Dusk³</title>
    <link>${siteUrl}</link>
    <description>基于 Next.js 构建的个人博客</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <atom:author>
      <atom:name>${escapeXml(authorName)}</atom:name>
    </atom:author>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt || stripHtml(post.content).slice(0, 200))}</description>
      <content:encoded>${escapeXml(post.content)}</content:encoded>
      <atom:author>
        <atom:name>${escapeXml(post.author?.name || "Admin")}</atom:name>
      </atom:author>
      ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ""}
      ${post.tags.map((tag) => `<category>${escapeXml(tag.name)}</category>`).join("\n      ")}
    </item>
    `
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
