import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { FileText } from "lucide-react";

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
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-10 flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">归档</h1>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          共 {posts.length} 篇
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">暂无文章</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([year, yearPosts]) => (
            <section id={`year-${year}`} key={year} className="relative scroll-mt-28">
              {/* Section-local timeline line */}
              <div
                className="absolute left-4 top-3 bottom-0 z-0 w-px -translate-x-1/2 bg-border sm:left-6 sm:top-4"
                aria-hidden="true"
              />

              {/* Year marker */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex w-8 justify-center sm:w-12">
                  <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-border bg-background sm:h-6 sm:w-6">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground sm:h-2 sm:w-2" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {year}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {yearPosts.length} 篇
                </span>
              </div>

              {/* Posts under this year */}
              <ul className="space-y-1">
                {yearPosts.map((post) => (
                  <li key={post.id} className="group flex items-center py-2">
                    <div className="flex w-8 justify-center sm:w-12">
                      <div className="relative z-10 h-2 w-2 rounded-full border border-muted-foreground/40 bg-background transition-colors group-hover:border-primary sm:h-2.5 sm:w-2.5" />
                    </div>

                    <Link
                      href={`/posts/${post.slug}`}
                      className="flex items-baseline gap-4"
                    >
                      <time className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums transition-colors group-hover:text-foreground sm:text-sm">
                        {format(post.createdAt, "MM-dd")}
                      </time>
                      <span className="text-sm font-medium text-foreground transition-colors duration-150 group-hover:text-primary sm:text-base">
                        {post.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
