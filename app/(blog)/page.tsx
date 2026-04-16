import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      category: true,
      tags: true,
    },
  });

  const featuredPost = posts[0];
  const latestPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="relative">
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Script & Style
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
                一个更像个人出版物的技术博客。
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                这里记录前端开发、设计判断和一些生活切片。首页不再只是文章堆叠，而是先告诉读者你是谁、最近在写什么、为什么值得继续往下看。
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Published
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {posts.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">已发布文章</p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Latest
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                {featuredPost
                  ? format(new Date(featuredPost.createdAt), "yyyy.MM.dd", {
                      locale: zhCN,
                    })
                  : "--"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">最近更新日期</p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Focus
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">Frontend / Notes</p>
              <p className="mt-1 text-xs text-muted-foreground">偏前端、设计与随笔</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              暂无文章，稍后再来看看吧
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {featuredPost && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <Link
                  href={`/posts/${featuredPost.slug}`}
                  className="group relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] transition-transform duration-200 hover:-translate-y-0.5 sm:p-8"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_38%)] opacity-80" />
                  <div className="relative flex h-full flex-col justify-between gap-10">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border/80 bg-background/80 px-2.5 py-1 font-medium text-foreground">
                          {featuredPost.pinned ? "置顶文章" : "最新文章"}
                        </span>
                        {featuredPost.category && <span>{featuredPost.category.name}</span>}
                        <span>
                          {format(new Date(featuredPost.createdAt), "yyyy 年 M 月 d 日", {
                            locale: zhCN,
                          })}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                          {featuredPost.title}
                        </h2>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                          {featuredPost.excerpt || `${featuredPost.content.slice(0, 180)}...`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-2">
                        {featuredPost.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag.name}
                            className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        进入阅读
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="rounded-[2rem] border border-border/70 bg-muted/35 p-6">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Why It Feels Better
                  </p>
                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-sm font-medium text-foreground">先给方向，再给列表</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        博客首页需要一个明确开场，不该一上来就是毫无区分的文章卡片。
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">让重点文章有主视觉</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        置顶或最新内容应该先被看到，否则首页缺少“我现在最想让你读什么”。
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">信息密度更均衡</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        顶部提供品牌说明和状态摘要，下面再进入连续阅读流，节奏会自然很多。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Recent Writing
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                      最近发布
                    </h3>
                  </div>
                  <Link
                    href="/archive"
                    className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                  >
                    查看归档
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {latestPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Reading Notes
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    现在的博客更像长期栏目：精选一篇作为封面，其余文章保持节奏一致，适合持续更新，而不是每次都重新设计首页。
                  </p>
                </div>
                <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Explore
                  </p>
                  <div className="mt-4 space-y-3 text-sm">
                    <Link
                      href="/about"
                      className="flex items-center justify-between text-muted-foreground transition-colors hover:text-foreground"
                    >
                      关于作者
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/friends"
                      className="flex items-center justify-between text-muted-foreground transition-colors hover:text-foreground"
                    >
                      友链页面
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/archive"
                      className="flex items-center justify-between text-muted-foreground transition-colors hover:text-foreground"
                    >
                      全部归档
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
