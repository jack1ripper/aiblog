import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/gravatar";

export const metadata: Metadata = {
  title: "关于",
  description: "关于我的博客",
};

export default async function AboutPage() {
  const author = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { name: true, email: true, image: true, bio: true },
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">关于</h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        {author ? (
          <div className="mb-8 flex items-start gap-5 not-prose">
            <Avatar
              src={getAvatarUrl(author.email, author.image, 160)}
              alt={author.name || ""}
              fallback={author.name || "?"}
              className="h-20 w-20"
            />
            <div>
              <div className="text-xl font-semibold">{author.name || "匿名作者"}</div>
              <p className="mt-2 text-muted-foreground">{author.bio || "暂无简介"}</p>
            </div>
          </div>
        ) : null}

        <p>
          这里是基于 <strong>Next.js</strong> 构建的个人博客，专注于记录技术成长、生活感悟与行业观察。
        </p>
        <p>
          如果你对我的文章感兴趣，欢迎通过以下方式关注我：
        </p>
        <ul>
          <li>GitHub: @yourname</li>
          <li>Twitter / X: @yourname</li>
          <li>Email: hello@example.com</li>
        </ul>
        <p>
          感谢你的访问，希望这里的内容对你有所帮助。
        </p>
      </div>
    </div>
  );
}
