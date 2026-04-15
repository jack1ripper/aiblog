"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownEditor } from "./markdown-editor";
import { generateSlug } from "@/lib/slugify";

interface PostFormProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage: string;
    published: boolean;
    pinned?: boolean;
    categoryId?: string;
    tagNames: string[];
    seriesId?: string;
    seriesOrder?: number;
    updatedAt?: string;
  };
  categories: { id: string; name: string }[];
  series: { id: string; name: string }[];
}

interface DraftData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  published: boolean;
  pinned: boolean;
  categoryId: string;
  tags: string;
  seriesId: string;
  seriesOrder: number;
  savedAt: number;
}

function getDraftKey(postId?: string) {
  return `draft-post-${postId || "new"}`;
}

export function PostForm({ initialData, categories, series }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const published = initialData?.published ?? false;
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [tags, setTags] = useState(initialData?.tagNames.join(", ") || "");
  const [pinned, setPinned] = useState(initialData?.pinned ?? false);
  const [seriesId, setSeriesId] = useState(initialData?.seriesId || "");
  const [seriesOrder, setSeriesOrder] = useState(initialData?.seriesOrder ?? 0);
  const [loadingTarget, setLoadingTarget] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [draftNotice, setDraftNotice] = useState<{ hasDraft: boolean; savedAt: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftKey = getDraftKey(initialData?.id);

  // Check localStorage for existing draft on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const draft: DraftData = JSON.parse(raw);
      const postUpdatedAt = initialData?.updatedAt ? new Date(initialData.updatedAt).getTime() : 0;
      if (draft.savedAt > postUpdatedAt) {
        setDraftNotice({ hasDraft: true, savedAt: draft.savedAt });
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, initialData?.updatedAt]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = setInterval(() => {
      const draft: DraftData = {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        published,
        pinned,
        categoryId,
        tags,
        seriesId,
        seriesOrder,
        savedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }, 30000);
    return () => clearInterval(interval);
  }, [title, slug, content, excerpt, coverImage, published, pinned, categoryId, tags, seriesId, seriesOrder, draftKey]);

  function restoreDraft() {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const draft: DraftData = JSON.parse(raw);
      setTitle(draft.title);
      setSlug(draft.slug);
      setContent(draft.content);
      setExcerpt(draft.excerpt);
      setCoverImage(draft.coverImage);
      setCategoryId(draft.categoryId);
      setTags(draft.tags);
      setPinned(draft.pinned);
      setSeriesId(draft.seriesId);
      setSeriesOrder(draft.seriesOrder);
      setDraftNotice(null);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }

  function dismissDraftNotice() {
    setDraftNotice(null);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "上传失败");
      }
      if (data.url) {
        setCoverImage(data.url);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function save(willPublish: boolean) {
    setLoadingTarget(willPublish ? "publish" : "draft");
    setError("");

    const payload = {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      published: willPublish,
      pinned,
      seriesId: seriesId || undefined,
      seriesOrder: Number(seriesOrder) || 0,
      categoryId: categoryId || undefined,
      tagNames: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const url = initialData?.id ? `/api/posts/${initialData.id}` : "/api/posts";
    const method = initialData?.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.removeItem(draftKey);
        }
        if (data.newsletterSent) {
          alert(`文章已发布，邮件提醒已发送给 ${data.newsletter?.sent || 0} 位订阅者。`);
        }
        router.push("/jack/posts");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "保存失败，请稍后重试");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "网络错误");
    }

    setLoadingTarget(null);
  }

  const isSavingDraft = loadingTarget === "draft";
  const isPublishing = loadingTarget === "publish";

  return (
    <form className="max-w-3xl space-y-6" onSubmit={(e) => e.preventDefault()}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {draftNotice?.hasDraft && (
        <Alert variant="default">
          <AlertDescription>
            <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>
                检测到自动保存的草稿（
                {new Date(draftNotice.savedAt).toLocaleString("zh-CN")}
                ），是否恢复？
              </span>
              <span className="flex gap-2">
                <Button type="button" size="sm" onClick={restoreDraft}>
                  恢复草稿
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={dismissDraftNotice}>
                  忽略
                </Button>
              </span>
            </span>
          </AlertDescription>
        </Alert>
      )}

      {initialData?.id && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">当前状态：</span>
          {published ? (
            <Badge variant="default">已发布</Badge>
          ) : (
            <Badge variant="secondary">草稿</Badge>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">标题</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            const newTitle = e.target.value;
            setTitle(newTitle);
            if (!initialData?.id) {
              setSlug(generateSlug(newTitle));
            }
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL 标识（自动生成）</Label>
        <Input
          id="slug"
          value={slug}
          disabled
          className="bg-muted text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">摘要</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          placeholder="选填，为空时自动截取正文前 120 字"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverImage">封面图</Label>
        <div className="flex gap-2">
          <Input
            id="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="w-auto"
          />
        </div>
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="封面预览" className="mt-2 h-32 rounded-md object-cover" />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">分类</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">无</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">标签（用逗号分隔）</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="技术, 生活, 教程"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="series">所属系列</Label>
          <select
            id="series"
            value={seriesId}
            onChange={(e) => setSeriesId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">无</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seriesOrder">系列内顺序</Label>
          <Input
            id="seriesOrder"
            type="number"
            min={0}
            value={seriesOrder}
            onChange={(e) => setSeriesOrder(Number(e.target.value))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="pinned"
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <Label htmlFor="pinned" className="cursor-pointer text-sm font-medium">
          置顶文章
        </Label>
      </div>

      <div className="space-y-2">
        <Label>正文（支持 Markdown）</Label>
        <MarkdownEditor value={content} onChange={setContent} />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSavingDraft || isPublishing}
          onClick={() => save(false)}
        >
          {isSavingDraft ? "保存中..." : "保存为草稿"}
        </Button>
        <Button
          type="button"
          disabled={isSavingDraft || isPublishing}
          onClick={() => save(true)}
        >
          {isPublishing ? "发布中..." : initialData?.id ? "更新并发布" : "发布文章"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/jack/posts")}>
          取消
        </Button>
      </div>
    </form>
  );
}
