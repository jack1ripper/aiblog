import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Eye } from "lucide-react";

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
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group py-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <time>{format(new Date(post.createdAt), "yyyy年MM月dd日", { locale: zhCN })}</time>
        {(post.views ?? 0) > 0 && (
          <>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.views}
            </span>
          </>
        )}
        {post.category && (
          <>
            <span className="text-border">·</span>
            <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
          </>
        )}
      </div>

      <Link href={`/posts/${post.slug}`} className="mt-3 block">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground transition-colors duration-150 group-hover:text-primary">
          {post.title}
        </h2>
      </Link>

      <p className="mt-3 line-clamp-2 text-base leading-relaxed text-muted-foreground">
        {post.excerpt || post.content.slice(0, 200) + "..."}
      </p>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag.name} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}
