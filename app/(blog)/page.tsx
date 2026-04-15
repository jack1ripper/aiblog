import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/gravatar";
import { ArrowRight, Rss, FileText } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: [
      { pinned: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      category: true,
      tags: true,
    },
  });

  const author = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { name: true, email: true, image: true, bio: true },
  });

  return (
    <div className="min-h-screen">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="container relative mx-auto px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                  <FileText className="h-3.5 w-3.5" />
                  <span>共 {posts.length} 篇文章</span>
                </div>

                <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                  <span className="bg-gradient-to-br from-foreground via-foreground to-muted-foreground/70 bg-clip-text text-transparent">
                    我的博客
                  </span>
                </h1>

                <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  记录技术、生活与思考。在这里分享关于前端开发、工程实践以及日常随笔。
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/archive"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    浏览归档
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <span className="hidden h-4 w-px bg-border sm:block" />
                  <Link
                    href="/feed.xml"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Rss className="h-4 w-4" />
                    RSS 订阅
                  </Link>
                </div>
              </div>

              {author && (
                <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-muted/30 p-4 backdrop-blur-sm transition-colors hover:bg-muted/50 sm:flex-col sm:items-center sm:gap-3 sm:rounded-xl sm:p-5">
                  <Avatar
                    src={getAvatarUrl(author.email, author.image, 120)}
                    alt={author.name || ""}
                    fallback={author.name || "?"}
                    className="h-14 w-14 sm:h-16 sm:w-16"
                  />
                  <div className="sm:text-center">
                    <div className="text-sm font-semibold text-foreground">
                      {author.name || "匿名作者"}
                    </div>
                    <div className="mt-0.5 max-w-[180px] truncate text-xs text-muted-foreground">
                      {author.bio || "暂无简介"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Posts Section */}
      <section className="container relative mx-auto px-4 py-12 sm:py-16">
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
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                最新文章
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
