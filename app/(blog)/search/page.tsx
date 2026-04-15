import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <strong key={i} className="text-foreground">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function getExcerpt(post: { excerpt: string | null; content: string }, keyword: string, maxLength = 160) {
  const raw = post.excerpt || post.content || "";
  if (!keyword.trim()) return raw.slice(0, maxLength);
  const index = raw.toLowerCase().indexOf(keyword.toLowerCase());
  if (index === -1) return raw.slice(0, maxLength);
  const start = Math.max(0, index - 50);
  const end = Math.min(raw.length, index + maxLength);
  let snippet = raw.slice(start, end);
  if (start > 0) snippet = "…" + snippet;
  if (end < raw.length) snippet = snippet + "…";
  return snippet;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
            { tags: { some: { name: { contains: query } } } },
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
            未找到相关文章
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <Link href={`/posts/${post.slug}`} className="block focus:outline-none">
                  <div className="text-base font-semibold text-foreground">
                    <Highlight text={post.title} keyword={query} />
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    <Highlight
                      text={getExcerpt(post, query)}
                      keyword={query}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground/70">
                    {formatDate(post.createdAt)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="text-center text-muted-foreground">
          输入关键词开始搜索
        </div>
      )}
    </div>
  );
}
