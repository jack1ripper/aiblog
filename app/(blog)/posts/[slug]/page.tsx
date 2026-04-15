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
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true },
  });

  if (!post) return { title: "页面不存在" };

  return {
    title: post.title,
    description: post.excerpt || undefined,
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
            </div>
          </header>

          {post.coverImage && (
            <div className="mb-8 overflow-hidden rounded-xl">
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
                className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:border-primary/30 hover:shadow-sm"
              >
                <span className="mb-1 flex items-center text-xs text-muted-foreground">
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  上一篇
                </span>
                <span className="line-clamp-1 font-medium text-foreground transition-colors group-hover:text-primary">
                  {prevPost.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {nextPost ? (
              <Link
                href={`/posts/${nextPost.slug}`}
                className="group flex flex-col items-end rounded-xl border border-border bg-card p-4 text-right transition-all duration-150 hover:border-primary/30 hover:shadow-sm"
              >
                <span className="mb-1 flex items-center text-xs text-muted-foreground">
                  下一篇
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </span>
                <span className="line-clamp-1 font-medium text-foreground transition-colors group-hover:text-primary">
                  {nextPost.title}
                </span>
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
