import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { FileText } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: [
      { pinned: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      category: true,
      tags: true,
    },
  });

  return (
    <div className="min-h-screen">
      <AnimatedBackground />

      <section className="container relative mx-auto px-4 py-6 sm:py-8">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              暂无文章，稍后再来看看吧
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
