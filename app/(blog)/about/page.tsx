import { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
  description: "关于我的博客",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">关于</h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
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
