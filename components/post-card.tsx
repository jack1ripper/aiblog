import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    coverImage: string | null;
    published: boolean;
    createdAt: Date;
    category: { name: string } | null;
    tags: { name: string }[];
    views?: number;
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="group overflow-hidden transition-all duration-150 hover:shadow-md">
      <Link href={`/posts/${post.slug}`}>
        {post.coverImage ? (
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted" />
        )}
      </Link>
      <CardContent className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {post.category && (
            <Badge variant="secondary">{post.category.name}</Badge>
          )}
          {post.tags.map((tag) => (
            <Badge key={tag.name} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
        <Link href={`/posts/${post.slug}`}>
          <h3 className="mb-2 text-xl font-semibold leading-tight transition-colors duration-150 hover:text-primary">
            {post.title}
          </h3>
        </Link>
        <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
          {post.excerpt || post.content.slice(0, 300) + "..."}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <time>{format(new Date(post.createdAt), "yyyy年MM月dd日", { locale: zhCN })}</time>
          {(post.views ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.views}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
