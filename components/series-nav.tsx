import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface SeriesNavProps {
  series: {
    id: string;
    name: string;
    slug: string;
    posts: {
      id: string;
      title: string;
      slug: string;
      seriesOrder: number;
    }[];
  };
  currentPostId: string;
}

export function SeriesNav({ series, currentPostId }: SeriesNavProps) {
  const sortedPosts = [...series.posts].sort((a, b) => a.seriesOrder - b.seriesOrder);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">系列文章</span>
        <span className="text-sm text-muted-foreground">· {series.name}</span>
      </div>

      <ol className="space-y-2">
        {sortedPosts.map((post, index) => {
          const isCurrent = post.id === currentPostId;
          return (
            <li key={post.id}>
              <Link
                href={`/posts/${post.slug}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isCurrent
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="line-clamp-1">{post.title}</span>
                {isCurrent && (
                  <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                    当前
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
