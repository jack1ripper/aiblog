import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/post-form";

export default async function NewPostPage() {
  const [categories, series] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.series.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新建文章</h1>
      <PostForm
        categories={categories}
        series={series}
        initialData={{
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          coverImage: "",
          published: false,
          tagNames: [],
        }}
      />
    </div>
  );
}
