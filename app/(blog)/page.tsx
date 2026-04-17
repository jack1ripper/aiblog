import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowRight, FileText, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PostListRow } from "@/components/post-list-row";

const HOME_PAGE_POST_LIMIT = 8;

export default async function HomePage() {
  const [posts, latestPosts, categoriesRaw, tagsRaw] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        pinned: true,
        category: { select: { name: true } },
      },
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true },
    }),
    prisma.category.findMany({
      where: { posts: { some: { published: true } } },
      select: {
        name: true,
        posts: { where: { published: true }, select: { id: true } },
      },
    }),
    prisma.tag.findMany({
      where: { posts: { some: { published: true } } },
      select: {
        name: true,
        posts: { where: { published: true }, select: { id: true } },
      },
    }),
  ]);

  const categories = categoriesRaw
    .map((category) => ({ name: category.name, count: category.posts.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const tags = tagsRaw
    .map((tag) => ({ name: tag.name, count: tag.posts.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const featuredPost = posts[0];
  const visiblePosts = posts.slice(0, HOME_PAGE_POST_LIMIT);
  const hasMorePosts = posts.length > HOME_PAGE_POST_LIMIT;
  const yearMap = posts.reduce<Record<string, number>>((acc, post) => {
    const year = format(new Date(post.createdAt), "yyyy", { locale: zhCN });
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});
  const years = Object.entries(yearMap)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 8);

  return (
    <div className="relative">
      <section className="safe-x mx-auto w-full max-w-6xl pt-6 pb-10 sm:pt-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <div className="mb-5 flex min-w-0 items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                  最新文章
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  共 {posts.length} 篇，首页默认展示最近 {visiblePosts.length} 篇
                </p>
              </div>
              <Link
                href="/archive"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
              >
                查看归档
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {visiblePosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  暂无文章，稍后再来看看吧
                </p>
              </div>
            ) : (
              <div className="relative min-w-0 w-full overflow-hidden">
                <span
                  aria-hidden="true"
                  className="absolute top-2 bottom-2 left-2.5 w-px bg-border/65"
                />
                <ul className="w-full space-y-0.5 sm:space-y-1">
                  {visiblePosts.map((post) => (
                    <PostListRow key={post.id} post={post} />
                  ))}
                </ul>
                {hasMorePosts && (
                  <div className="pt-4">
                    <Link
                      href="/archive"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      查看更多文章
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="min-w-0 lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-28">
              <section className="max-w-full overflow-hidden rounded-xl border border-sky-200/45 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(240,249,255,0.9))] p-4 dark:border-sky-400/20 dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.78),rgba(15,23,42,0.86))]">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>最新更新</span>
                  {featuredPost && (
                    <span>{format(new Date(featuredPost.createdAt), "yyyy.MM.dd", { locale: zhCN })}</span>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-foreground">站内搜索</h2>
                <form action="/search" method="get" className="mt-3 flex gap-2">
                  <input
                    name="q"
                    placeholder="关键词..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="搜索"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </section>

              <section className="max-w-full overflow-hidden rounded-xl border border-amber-200/50 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(255,251,235,0.88))] p-4 dark:border-amber-400/20 dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.78),rgba(69,39,16,0.5))]">
                <h2 className="text-sm font-semibold text-foreground">年份归档</h2>
                {years.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {years.map(([year, count]) => (
                      <Link
                        key={year}
                        href={`/archive#year-${year}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      >
                        <span>{year}</span>
                        <span>{count} 篇</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">暂无归档数据</p>
                )}
              </section>

              <section className="max-w-full overflow-hidden rounded-xl border border-indigo-200/45 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(238,242,255,0.88))] p-4 dark:border-indigo-400/20 dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.78),rgba(30,27,75,0.82))]">
                <h2 className="text-sm font-semibold text-foreground">分类与标签</h2>
                <div className="mt-3 space-y-3">
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Link
                          key={category.name}
                          href={`/categories/${encodeURIComponent(category.name)}`}
                          className="max-w-full break-words rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {category.name} ({category.count})
                        </Link>
                      ))}
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Link
                          key={tag.name}
                          href={`/tags/${encodeURIComponent(tag.name)}`}
                          className="max-w-full break-words rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          #{tag.name} ({tag.count})
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="max-w-full overflow-hidden rounded-xl border border-emerald-200/45 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(236,253,245,0.88))] p-4 dark:border-emerald-400/20 dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.78),rgba(6,78,59,0.45))]">
                <h2 className="text-sm font-semibold text-foreground">最近更新</h2>
                {latestPosts.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {latestPosts.map((post) => (
                      <li key={post.id}>
                        <Link
                          href={`/posts/${post.slug}`}
                          className="line-clamp-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                        >
                          {post.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">暂无更新</p>
                )}
              </section>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
