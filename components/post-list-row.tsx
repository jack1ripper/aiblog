import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";

interface PostListRowProps {
  post: {
    id: string;
    title: string;
    slug: string;
    createdAt: Date;
    pinned: boolean;
    category: { name: string } | null;
  };
}

export function PostListRow({ post }: PostListRowProps) {
  return (
    <li className="group relative w-full max-w-full overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute left-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-muted-foreground/65 transition-colors duration-150 group-hover:bg-primary"
      />
      <Link
        href={`/posts/${post.slug}`}
        className="flex w-full min-w-0 max-w-full items-center gap-2 rounded-md py-1.5 pr-3 pl-6 transition-colors duration-150 hover:bg-muted/35 focus-visible:bg-muted/35 focus-visible:outline-none"
      >
        <time className="w-16 shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground sm:w-20 sm:text-xs">
          {format(new Date(post.createdAt), "MM.dd", { locale: zhCN })}
        </time>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-foreground transition-colors duration-150 group-hover:text-primary sm:text-[15px]">
              {post.title}
            </h2>
            {post.pinned && (
              <span className="shrink-0 rounded border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                置顶
              </span>
            )}
            {post.category && (
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                · {post.category.name}
              </span>
            )}
          </div>
        </div>

        <ArrowUpRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:block sm:h-4 sm:w-4" />
      </Link>
    </li>
  );
}
