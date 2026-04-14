import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const posts = query
    ? await prisma.post.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { excerpt: { contains: query } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: { category: true, tags: true },
      })
    : [];

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">搜索文章</h1>
      <form action="/search" method="get" className="mb-8 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="输入关键词搜索..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          搜索
        </button>
      </form>

      {query ? (
        posts.length === 0 ? (
          <div className="text-center text-muted-foreground">
            未找到与 &quot;{query}&quot; 相关的文章
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center text-muted-foreground">
          输入关键词开始搜索
        </div>
      )}
    </div>
  );
}
