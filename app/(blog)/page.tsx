import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      tags: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          我的博客
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          记录技术、生活与思考
        </p>
      </section>

      {posts.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          暂无文章，稍后再来看看吧
        </div>
      ) : (
        <div className="mx-auto max-w-3xl divide-y divide-border">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
