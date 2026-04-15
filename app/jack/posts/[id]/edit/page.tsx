import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/post-form";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { category: true, tags: true },
  });

  if (!post) {
    notFound();
  }

  const [categories, series] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.series.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">编辑文章</h1>
      <PostForm
        categories={categories}
        series={series}
        initialData={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt || "",
          coverImage: post.coverImage || "",
          published: post.published,
          pinned: post.pinned,
          categoryId: post.categoryId || undefined,
          tagNames: post.tags.map((t) => t.name),
          seriesId: post.seriesId || undefined,
          seriesOrder: post.seriesOrder,
        }}
      />
    </div>
  );
}
