"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  pinned: boolean;
  createdAt: string;
}

interface ImportedPostResult {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  editPath: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<ImportedPostResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts?page=1&limit=100")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "加载文章失败");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setPosts(data.posts || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "网络错误");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这篇文章吗？")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "删除失败");
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function handlePublish(post: Post) {
    setPublishingId(post.id);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "发布失败");
      }
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: true } : p))
      );
      if (data.newsletterSent) {
        alert(`文章已发布，邮件提醒已发送给 ${data.newsletter?.sent || 0} 位订阅者。`);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "发布失败");
    }
    setPublishingId(null);
  }

  async function handleImportFromUrl() {
    if (!importUrl.trim()) {
      setImportError("请先粘贴博客地址");
      return;
    }

    setImportError("");
    setImportResult(null);
    setImporting(true);

    try {
      const res = await fetch("/api/admin/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim(), published: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "导入失败");
      }

      setImportResult(data);
      setImportUrl("");
      setPosts((prev) => [
        {
          id: data.id,
          title: data.title,
          slug: data.slug,
          published: data.published,
          pinned: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/jack/posts/new">
          <Button>新建文章</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border bg-muted/20 p-4">
        <div className="mb-3 space-y-1">
          <h2 className="text-sm font-semibold">URL 自动导入</h2>
          <p className="text-xs text-muted-foreground">
            粘贴文章链接后，系统会自动抓取正文并保存为草稿，你可以再进入编辑器二次润色。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://example.com/blog/post"
            className="flex-1"
          />
          <Button onClick={handleImportFromUrl} disabled={importing}>
            {importing ? "导入中..." : "导入为草稿"}
          </Button>
        </div>
        {importError && (
          <p className="mt-2 text-xs text-destructive">{importError}</p>
        )}
        {importResult && (
          <p className="mt-2 text-xs text-muted-foreground">
            导入成功：{importResult.title}。
            <Link href={importResult.editPath} className="ml-1 underline underline-offset-2">
              去编辑
            </Link>
          </p>
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {posts.length === 0 ? (
          <div className="rounded-md border p-5 text-center text-sm text-muted-foreground">暂无文章</div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="space-y-3 rounded-md border p-4">
              <div className="space-y-2">
                <Link
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  className="block break-words text-sm font-medium leading-6 hover:underline"
                >
                  {post.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {post.published ? (
                    <Badge variant="default">已发布</Badge>
                  ) : (
                    <Badge variant="secondary">草稿</Badge>
                  )}
                  {post.pinned && <Badge variant="default">置顶</Badge>}
                  <span>{format(new Date(post.createdAt), "yyyy-MM-dd")}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!post.published && (
                  <Button
                    size="sm"
                    disabled={publishingId === post.id}
                    onClick={() => handlePublish(post)}
                  >
                    {publishingId === post.id ? "发布中..." : "发布"}
                  </Button>
                )}
                <Link href={`/jack/posts/${post.id}/edit`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border hover:border-transparent hover:bg-muted"
                  >
                    编辑
                  </Button>
                </Link>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                  删除
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/posts/${post.slug}`}
                    target="_blank"
                    className="hover:underline"
                  >
                    {post.title}
                  </Link>
                  {post.pinned && (
                    <Badge variant="default" className="ml-2">置顶</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {post.published ? (
                    <Badge variant="default">已发布</Badge>
                  ) : (
                    <Badge variant="secondary">草稿</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(post.createdAt), "yyyy-MM-dd")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!post.published && (
                      <Button
                        size="sm"
                        disabled={publishingId === post.id}
                        onClick={() => handlePublish(post)}
                      >
                        {publishingId === post.id ? "发布中..." : "发布"}
                      </Button>
                    )}
                    <Link href={`/jack/posts/${post.id}/edit`}>
                      <Button size="sm" variant="outline" className="border-border hover:border-transparent hover:bg-muted">编辑</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  暂无文章
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
