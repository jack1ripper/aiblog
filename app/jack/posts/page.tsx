"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface ImportQuality {
  score: number;
  level: "high" | "medium" | "low";
  issues: string[];
  wordCount: number;
  hasCoverImage: boolean;
}

interface ImportPreview {
  sourceUrl: string;
  sourceHost: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: string;
  tagNames: string[];
  quality: ImportQuality;
}

interface ImportDuplicate {
  reason: "sourceUrl" | "title";
  post: {
    id: string;
    title: string;
    slug: string;
    sourceUrl: string | null;
  };
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [importUrl, setImportUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<ImportedPostResult | null>(null);

  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [duplicate, setDuplicate] = useState<ImportDuplicate | null>(null);

  const [titleDraft, setTitleDraft] = useState("");
  const [excerptDraft, setExcerptDraft] = useState("");
  const [coverImageDraft, setCoverImageDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("转载");
  const [tagDraft, setTagDraft] = useState("");

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

  async function handleAnalyzeUrl() {
    if (!importUrl.trim()) {
      setImportError("请先粘贴博客地址");
      return;
    }

    setImportError("");
    setImportResult(null);
    setAnalyzing(true);

    try {
      const res = await fetch("/api/admin/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "preview", url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "分析失败");
      }

      const fetchedPreview: ImportPreview = data.preview;
      setPreview(fetchedPreview);
      setDuplicate(data.duplicate || null);
      setTitleDraft(fetchedPreview.title);
      setExcerptDraft(fetchedPreview.excerpt || "");
      setCoverImageDraft(fetchedPreview.coverImage || "");
      setTagDraft(fetchedPreview.tagNames.join(", "));
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "分析失败");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirmImport(forceImport = false) {
    if (!preview) return;

    setImportError("");
    setImporting(true);

    try {
      const res = await fetch("/api/admin/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "import",
          url: preview.sourceUrl,
          title: titleDraft,
          excerpt: excerptDraft,
          coverImage: coverImageDraft,
          categoryName: categoryDraft,
          tagNames: tagDraft
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          content: preview.content,
          published: false,
          forceImport,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.duplicate) {
          setDuplicate(data.duplicate);
        }
        throw new Error(data.error || "导入失败");
      }

      setImportResult(data);
      setImportUrl("");
      setPreview(null);
      setDuplicate(null);
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

  const qualityLabel = useMemo(() => {
    if (!preview) return "";
    if (preview.quality.level === "high") return "高质量";
    if (preview.quality.level === "medium") return "中等质量";
    return "低质量";
  }, [preview]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-md border">
          <div className="space-y-3 p-4">
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
          <h2 className="text-sm font-semibold">URL 自动导入（分析后确认）</h2>
          <p className="text-xs text-muted-foreground">
            先分析抓取质量与重复风险，再确认导入草稿，避免错误或重复入库。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://example.com/blog/post"
            className="flex-1"
          />
          <Button onClick={handleAnalyzeUrl} disabled={analyzing}>
            {analyzing ? "分析中..." : "分析链接"}
          </Button>
        </div>

        {importError && <p className="mt-2 text-xs text-destructive">{importError}</p>}

        {preview && (
          <div className="mt-4 space-y-3 rounded-md border bg-background p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={preview.quality.level === "low" ? "destructive" : "secondary"}>
                质量分 {preview.quality.score}
              </Badge>
              <span className="text-muted-foreground">{qualityLabel}</span>
              <span className="text-muted-foreground">约 {preview.quality.wordCount} 字</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">标题</label>
                <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">分类</label>
                <Input value={categoryDraft} onChange={(e) => setCategoryDraft(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">摘要</label>
              <Textarea value={excerptDraft} onChange={(e) => setExcerptDraft(e.target.value)} rows={3} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">封面链接</label>
                <Input value={coverImageDraft} onChange={(e) => setCoverImageDraft(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">标签（逗号分隔）</label>
                <Input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} />
              </div>
            </div>

            {preview.quality.issues.length > 0 && (
              <div className="space-y-1 text-xs text-muted-foreground">
                {preview.quality.issues.map((item) => (
                  <p key={item}>- {item}</p>
                ))}
              </div>
            )}

            {duplicate && (
              <Alert variant={duplicate.reason === "sourceUrl" ? "destructive" : "default"}>
                <AlertDescription>
                  {duplicate.reason === "sourceUrl" ? "检测到同源文章已存在：" : "检测到同标题文章："}
                  <Link href={`/jack/posts/${duplicate.post.id}/edit`} className="ml-1 underline underline-offset-2">
                    {duplicate.post.title}
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleConfirmImport(false)} disabled={importing}>
                {importing ? "导入中..." : "确认导入草稿"}
              </Button>
              {duplicate?.reason === "sourceUrl" && (
                <Button variant="outline" onClick={() => handleConfirmImport(true)} disabled={importing}>
                  强制导入副本
                </Button>
              )}
            </div>
          </div>
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
