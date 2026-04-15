import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Toc } from "@/components/toc";
import { MobileToc } from "@/components/mobile-toc";
import { GiscusComments } from "@/components/giscus-comments";
import { AuthorCard } from "@/components/author-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Eye, Rss, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ReadingProgress } from "@/components/reading-progress";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true, author: { select: { name: true } } },
  });

  if (!post) return { title: "页面不存在" };

  const ogUrl = `/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author?.name || "")}`;

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: [ogUrl],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogUrl],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    include: {
      category: true,
      tags: true,
      author: { select: { name: true, image: true, bio: true, email: true } },
    },
  });

  if (!post) {
    notFound();
  }

  // increment views
  await prisma.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });

  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { published: true, createdAt: { lt: post.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: { published: true, createdAt: { gt: post.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  const wordCount = post.content.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 500));

  return (
    <div className="container mx-auto px-4 py-10">
      <ReadingProgress />
      <div className="mx-auto flex max-w-6xl gap-12">
        <article className="min-w-0 flex-1">
          <header className="mb-8">
            <div className="mb-3 flex flex-wrap gap-2">
              {post.category && <Badge variant="secondary">{post.category.name}</Badge>}
              {post.tags.map((tag) => (
                <Badge key={tag.name} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{post.author?.name || "匿名"}</span>
              <span className="hidden sm:inline">·</span>
              <time>{format(new Date(post.createdAt), "yyyy年MM月dd日", { locale: zhCN })}</time>
              <span className="hidden sm:inline">·</span>
              <span>约 {readTime} 分钟阅读</span>
              <span className="hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.views + 1} 阅读
              </span>
              <span className="hidden sm:inline">·</span>
              <Link
                href="/feed.xml"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <Rss className="h-3.5 w-3.5" />
                RSS
              </Link>
            </div>
          </header>

          {post.coverImage && (
            <div className="mb-8 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full object-cover"
              />
            </div>
          )}

          <Separator className="mb-8" />

          <MobileToc />

          <MarkdownRenderer content={post.content} />

          <Separator className="my-10" />

          <div className="grid gap-4 sm:grid-cols-2">
            {prevPost ? (
              <Link
                href={`/posts/${prevPost.slug}`}
                className="group relative flex flex-col rounded-xl border border-border/60 bg-muted/30 p-5 transition-all duration-200 hover:border-primary/40 hover:bg-muted/50"
              >
                <span className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  上一篇
                </span>
                <span className="line-clamp-2 font-medium text-foreground transition-colors group-hover:text-primary">
                  {prevPost.title}
                </span>
                <div className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-all duration-200 group-hover:h-6 group-hover:opacity-100" />
              </Link>
            ) : (
              <div />
            )}
            {nextPost ? (
              <Link
                href={`/posts/${nextPost.slug}`}
                className="group relative flex flex-col items-end rounded-xl border border-border/60 bg-muted/30 p-5 text-right transition-all duration-200 hover:border-primary/40 hover:bg-muted/50"
              >
                <span className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  下一篇
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="line-clamp-2 font-medium text-foreground transition-colors group-hover:text-primary">
                  {nextPost.title}
                </span>
                <div className="absolute right-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-all duration-200 group-hover:h-6 group-hover:opacity-100" />
              </Link>
            ) : (
              <div />
            )}
          </div>

          {post.author && (
            <div className="my-10">
              <AuthorCard
                name={post.author.name || "匿名作者"}
                email={post.author.email}
                image={post.author.image}
                bio={post.author.bio}
              />
            </div>
          )}

          <GiscusComments />
        </article>

        <aside className="hidden w-56 shrink-0 xl:block">
          <Toc />
        </aside>
      </div>
    </div>
  );
}
