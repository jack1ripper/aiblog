import { Metadata } from "next";

export const metadata: Metadata = {
  title: "友链",
  description: "友情链接",
};

const friends = [
  { name: "阮一峰的网络日志", url: "https://ruanyifeng.com/blog/", description: "科技爱好者周刊" },
  { name: "张鑫旭", url: "https://www.zhangxinxu.com/", description: "前端技术博客" },
];

export default function FriendsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">友链</h1>
      <p className="mb-8 text-muted-foreground">
        这里汇集了一些我经常在读的优质博客，排名不分先后。
      </p>
      <div className="grid gap-4">
        {friends.map((friend) => (
          <a
            key={friend.url}
            href={friend.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
                {friend.name}
              </h3>
              <span className="text-xs text-muted-foreground">→</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{friend.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
