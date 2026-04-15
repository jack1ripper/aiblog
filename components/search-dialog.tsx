"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

function getExcerpt(post: SearchPost, keyword: string, maxLength = 120) {
  const raw = post.excerpt || post.content || "";
  if (!keyword.trim()) return raw.slice(0, maxLength);
  const index = raw.toLowerCase().indexOf(keyword.toLowerCase());
  if (index === -1) return raw.slice(0, maxLength);
  const start = Math.max(0, index - 40);
  const end = Math.min(raw.length, index + maxLength);
  let snippet = raw.slice(start, end);
  if (start > 0) snippet = "…" + snippet;
  if (end < raw.length) snippet = snippet + "…";
  return snippet;
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [posts, setPosts] = React.useState<SearchPost[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setPosts([]);
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function handleSelect(slug: string) {
    setOpen(false);
    router.push(`/posts/${slug}`);
  }

  if (!mounted) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={() => setOpen(true)}
        aria-label="搜索"
      >
        <Search className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">搜索文章</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章标题、内容或标签…"
            className="h-8 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === "" ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              输入关键词开始搜索
            </div>
          ) : posts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              未找到相关文章
            </div>
          ) : (
            <ul className="py-2">
              {posts.map((post, idx) => (
                <li key={post.id}>
                  <button
                    onClick={() => handleSelect(post.slug)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none",
                      idx !== posts.length - 1 && "border-b border-border/50"
                    )}
                  >
                    <div className="text-sm font-medium text-foreground">
                      <Highlight text={post.title} keyword={query} />
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      <Highlight
                        text={getExcerpt(post, query)}
                        keyword={query}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground/70">
                      {formatDate(post.createdAt)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                ↑
              </kbd>{" "}
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                ↓
              </kbd>{" "}
              选择
            </span>
            <span>
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                ↵
              </kbd>{" "}
              打开
            </span>
          </div>
          <span>
            <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
              Esc
            </kbd>{" "}
            关闭
          </span>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
