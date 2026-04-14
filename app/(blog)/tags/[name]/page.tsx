import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";

interface TagPageProps {
  params: Promise<{ name: string }>;
}

export default async function TagPage({ params }: TagPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const tag = await prisma.tag.findUnique({
    where: { name: decodedName },
    include: {
      posts: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: { category: true, tags: true },
      },
    },
  });

  if (!tag) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">
        标签：{tag.name}
      </h1>
      {tag.posts.length === 0 ? (
        <div className="text-center text-muted-foreground">
          该标签下暂无文章
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tag.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
