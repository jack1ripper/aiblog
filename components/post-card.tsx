import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Eye, ArrowUpRight } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    published: boolean;
    createdAt: Date;
    category: { name: string } | null;
    tags: { name: string }[];
    views?: number;
    pinned?: boolean;
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group relative">
      <Link
        href={`/posts/${post.slug}`}
        className="relative block overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card sm:p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_36%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        <div className="relative flex items-start gap-5">
          <div className="hidden shrink-0 rounded-2xl border border-border/70 bg-muted/60 px-3 py-3 text-center sm:block">
            <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {format(new Date(post.createdAt), "MMM", { locale: zhCN })}
            </span>
            <span className="mt-1 block text-2xl font-semibold leading-none tracking-[-0.04em] text-foreground">
              {format(new Date(post.createdAt), "dd")}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            {post.pinned && (
              <span className="mb-3 inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary">
                置顶
              </span>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{format(new Date(post.createdAt), "yyyy 年 M 月 d 日", { locale: zhCN })}</span>
              {post.category && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  {post.category.name}
                </span>
              )}
              {(post.views ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {post.views}
                </span>
              )}
            </div>

            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground transition-colors duration-150 group-hover:text-primary sm:text-2xl">
              {post.title}
            </h2>

            <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">
              {post.excerpt || `${post.content.slice(0, 160)}...`}
            </p>

            {post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:border-border"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="hidden shrink-0 pt-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 sm:block">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </article>
  );
}
