import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function ArchivePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, createdAt: true },
  });

  const grouped: Record<string, typeof posts> = {};
  posts.forEach((post) => {
    const year = format(post.createdAt, "yyyy");
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(post);
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-10 text-3xl font-bold">归档</h1>
      <div className="space-y-10">
        {Object.entries(grouped).map(([year, yearPosts]) => (
          <section key={year}>
            <h2 className="mb-4 text-xl font-semibold text-foreground">{year}</h2>
            <ul className="space-y-3">
              {yearPosts.map((post) => (
                <li key={post.id} className="flex items-baseline gap-4 group">
                  <time className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {format(post.createdAt, "MM-dd")}
                  </time>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-base text-foreground transition-colors duration-150 hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {posts.length === 0 && (
          <div className="text-center text-muted-foreground">暂无文章</div>
        )}
      </div>
    </div>
  );
}
