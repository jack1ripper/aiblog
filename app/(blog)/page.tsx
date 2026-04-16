import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowRight, FileText } from "lucide-react";
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

  return (
    <div className="relative">
      <section className="mx-auto w-full max-w-6xl px-4 pb-5 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="rounded-[28px] border border-border/70 bg-card/78 px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                文章列表
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                以时间线方式浏览全部内容，置顶文章优先展示，帮助你快速找到最新和最重要的更新。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-muted-foreground">
                共 {posts.length} 篇
              </span>
              {featuredPost && (
                <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-muted-foreground">
                  最近更新 {format(new Date(featuredPost.createdAt), "yyyy.MM.dd", { locale: zhCN })}
                </span>
              )}
              <Link
                href="/archive"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-foreground transition-colors hover:bg-background"
              >
                查看归档
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {posts.length > 0 && (
            <div className="mt-4 grid gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:grid-cols-3 sm:text-sm">
              <p className="rounded-xl bg-background/60 px-3 py-2">
                首屏聚焦列表，减少冗余模块干扰阅读入口。
              </p>
              <p className="rounded-xl bg-background/60 px-3 py-2">
                上方保留关键指标，快速建立内容密度感知。
              </p>
              <p className="rounded-xl bg-background/60 px-3 py-2">
                通过归档入口承接深度浏览，缩短查找路径。
              </p>
            </div>
          )}
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
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
