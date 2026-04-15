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
        className="relative block rounded-xl border border-transparent p-5 transition-all duration-200 hover:border-border/60 hover:bg-muted/30"
      >
        {/* Left accent line on hover */}
        <div className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-all duration-200 group-hover:h-8 group-hover:opacity-100" />

        <div className="flex items-start gap-5">
          {/* Date column */}
          <div className="hidden shrink-0 flex-col items-center pt-1 sm:flex">
            <span className="text-xs font-medium text-muted-foreground">
              {format(new Date(post.createdAt), "yyyy")}
            </span>
            <span className="text-lg font-semibold leading-none text-foreground">
              {format(new Date(post.createdAt), "MM/dd")}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            {post.pinned && (
              <span className="mb-2 inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                置顶
              </span>
            )}
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="sm:hidden">
                {format(new Date(post.createdAt), "yyyy年MM月dd日", { locale: zhCN })}
              </span>
              {post.category && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary/70" />
                    {post.category.name}
                  </span>
                </>
              )}
              {(post.views ?? 0) > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.views}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground transition-colors duration-150 group-hover:text-primary">
              {post.title}
            </h2>

            {/* Excerpt */}
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt || post.content.slice(0, 160) + "..."}
            </p>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors group-hover:bg-muted/80"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Arrow icon */}
          <div className="hidden shrink-0 pt-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 sm:block">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </article>
  );
}
