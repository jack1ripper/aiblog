import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [posts, tags, categories] = await Promise.all([
    prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.tag.findMany({ select: { name: true } }),
    prisma.category.findMany({ select: { name: true } }),
  ]);

  const staticRoutes = ["/", "/search", "/about", "/friends", "/archive"].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));

  const postRoutes = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.slug}`,
    lastModified: post.updatedAt,
  }));

  const tagRoutes = tags.map((tag) => ({
    url: `${siteUrl}/tags/${encodeURIComponent(tag.name)}`,
    lastModified: new Date(),
  }));

  const categoryRoutes = categories.map((category) => ({
    url: `${siteUrl}/categories/${encodeURIComponent(category.name)}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes, ...categoryRoutes];
}
