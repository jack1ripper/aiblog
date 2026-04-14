"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  createdAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);

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
    } catch (err: any) {
      alert(err?.message || "删除失败");
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
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: true } : p))
      );
    } catch (err: any) {
      alert(err?.message || "发布失败");
    }
    setPublishingId(null);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/admin/posts/new">
          <Button>新建文章</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
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
                    <Link href={`/admin/posts/${post.id}/edit`}>
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
